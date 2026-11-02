import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret, cache-control, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Safely decode JWT payload without verifying signature (fallback)
function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // Use service role to bypass RLS entirely
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestData = await req.json();

    // --- Authentication ---
    let userId: string | null = null;
    let userEmail: string | null = null;
    let isAdmin = false;

    const adminEmailConfig = Deno.env.get('ADMIN_EMAIL') ?? '';
    const adminSecret = Deno.env.get('ADMIN_SECRET') ?? '';

    // Option 1: Simple admin secret bypass (most reliable)
    const adminSecretHeader = req.headers.get('x-admin-secret') || requestData.adminSecret;
    if (adminSecret && adminSecretHeader && adminSecretHeader === adminSecret) {
      isAdmin = true;
      userId = 'admin';
      userEmail = adminEmailConfig;
    }

    // Option 2: Decode the JWT, then resolve the authoritative Clerk user.
    if (!isAdmin) {
      const authHeader = req.headers.get('Authorization') ?? '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

      if (token) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          userId = payload.sub ?? null;
          // Email claims are optional in Clerk JWT templates.
          userEmail =
            payload.email ??
            payload.primary_email_address ??
            payload['https://clerk.dev/email'] ??
            payload.email_addresses?.[0]?.email_address ??
            null;
        }

        // Always fetch the Clerk user when possible because the Supabase
        // template may omit email claims or contain a non-primary address.
        if (userId && Deno.env.get('CLERK_SECRET_KEY')) {
          try {
            const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
              headers: { Authorization: `Bearer ${Deno.env.get('CLERK_SECRET_KEY')}` }
            });
            if (clerkRes.ok) {
              const clerkUser = await clerkRes.json();
              const primaryEmail = clerkUser?.email_addresses?.find(
                (e: any) => e.id === clerkUser?.primary_email_address_id
              );
              userEmail =
                primaryEmail?.email_address ??
                clerkUser?.email_addresses?.[0]?.email_address ??
                userEmail;
            }
          } catch (e) {
            console.error('Clerk fetch error:', e);
          }
        }

        const adminUserId = Deno.env.get('ADMIN_USER_ID') ?? '';
        const adminEmails = adminEmailConfig.split(',').map((e) => e.trim().toLowerCase());
        if (adminEmails.length && userEmail && adminEmails.includes(userEmail.trim().toLowerCase())) {
          isAdmin = true;
        }

        // Also check: if userId matches admin userId stored in env
        if (adminUserId && userId === adminUserId) {
          isAdmin = true;
        }
        
        // Option 3: Check database for user role
        if (!isAdmin && userId) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();
          if (roleData) {
            isAdmin = true;
          }
        }
      }
    }

    if (!userId && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No valid auth' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const action = requestData.action || 'read';
    const table = requestData.table || 'profiles';

    if (action === 'chat_list') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }

      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (conversationsError) throw conversationsError;

      const result = [];
      for (const conversation of conversations || []) {
        const { data: messages, error: messagesError } = await supabase
          .from('conversation_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });
        if (messagesError) throw messagesError;
        result.push({ ...conversation, messages: messages || [] });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'chat_reply') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }

      const { conversationId, message } = requestData;
      if (!conversationId || !String(message || '').trim()) {
        return new Response(JSON.stringify({ error: 'conversationId and message are required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const { data: insertedMessage, error: messageError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'owner',
          message: String(message).trim(),
        })
        .select()
        .single();
      if (messageError) throw messageError;

      const { error: conversationError } = await supabase
        .from('conversations')
        .update({
          last_message_at: insertedMessage.created_at,
          last_message_preview: String(message).trim(),
        })
        .eq('id', conversationId);
      if (conversationError) throw conversationError;

      return new Response(JSON.stringify(insertedMessage), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- User Orders (no admin required) ---
    if (table === 'user_orders') {
      const { userName } = requestData;
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const myOrders = orders?.filter((o: any) => {
        if (userId && o.user_id === userId) return true;
        if (o.notes && userId && o.notes.includes(`[clerk:${userId}]`)) return true;
        const dbName = (o.customer_name || '').toLowerCase().trim();
        const reqName = (userName || '').toLowerCase().trim();
        if (dbName && reqName && (dbName === reqName || dbName.includes(reqName))) return true;
        return false;
      }) || [];

      return new Response(JSON.stringify(myOrders), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- Review Actions (no admin required) ---
    if (action === 'create_review') {
      const { reviewData } = requestData;
      if (!userId || userId === 'admin') {
        throw new Error('Authentication is required to submit a review');
      }

      let authorName: string | null = null;
      try {
        const parsedComment = JSON.parse(reviewData?.comment || '{}');
        authorName = parsedComment.authorName || null;
      } catch {
        // Older clients may send plain-text comments.
      }

      // Keep the profile and review linked even when the browser-side profile
      // write is blocked by RLS or the profile does not exist yet.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { user_id: userId, full_name: authorName },
          { onConflict: 'user_id' }
        )
        .select('id')
        .single();
      if (profileError) throw profileError;

      const reviewPayload = {
        ...reviewData,
        user_id: userId,
        profile_id: profile.id,
      };
      const { data, error } = await supabase.from('reviews').insert(reviewPayload).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_review') {
      const { reviewId } = requestData;
      const { data: review } = await supabase.from('reviews').select('*').eq('id', reviewId).maybeSingle();
      if (!review) throw new Error("Review not found");

      let isAuthor = false;
      try {
        const parsed = JSON.parse(review.comment || '{}');
        if (parsed.clerkUserId === userId) isAuthor = true;
      } catch (_e) {}

      if (!isAuthor && !isAdmin) throw new Error("Unauthorized to delete this review");

      const { data, error } = await supabase.from('reviews').delete().eq('id', reviewId).select();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- ALL OTHER ACTIONS REQUIRE ADMIN ---
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    if (action === 'update_order') {
      const { orderId, updateData } = requestData;
      const { data, error } = await supabase.from('orders').update(updateData).eq('id', orderId).select();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'create_product') {
      const { productData } = requestData;
      const { data, error } = await supabase.from('products').insert(productData).select();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'update_product') {
      const { productId, productData } = requestData;
      const { data, error } = await supabase.from('products').update(productData).eq('id', productId).select();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'update_settings') {
      const { key, value } = requestData;
      const { data, error } = await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' });
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_product') {
      const { productId } = requestData;
      const { data, error } = await supabase.from('products').delete().eq('id', productId).select();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (action === 'delete_all_products') {
      const { data, error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (table === 'profiles') {
      const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify(profiles || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    if (table === 'orders') {
      const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify(orders), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid table/action request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (error: any) {
    console.error('admin-data error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
// force deploy comment
