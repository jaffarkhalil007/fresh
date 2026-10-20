import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY');
    const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
    const storeOwnerEmail = Deno.env.get('VITE_ADMIN_EMAIL') || "your_actual_email@gmail.com"; // Fallback to your email

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, type, adminNote } = await req.json();
    
    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }
    
    // Default dummy behavior if no RESEND_API_KEY is found
    // so we don't crash when running without proper env vars
    if (!resendApiKey) {
      console.log(`[Email Simulator] Would send email to customer for order ${orderId}, status ${type}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Simulated email send for ${type}. To actually send emails, add RESEND_API_KEY secret.` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Define the email subject and template based on type
    let subject = '';
    let html = '';
    
    const storeName = Deno.env.get("STORE_NAME") || "Hamaash";
    const orderRef = order.id.slice(0, 8);
    
    const toEmails = [];
    
    switch (type) {
      case 'new_order':
        subject = `New Order Received! - ${storeName}`;
        html = `
          <h2>You have a new order!</h2>
          <p>Hi Admin,</p>
          <p>A new order <strong>#${orderRef}</strong> has been placed by ${order.customer_name}.</p>
          <p><strong>Total Amount:</strong> Rs. ${order.total_amount}</p>
          <p><strong>Shipping Details:</strong><br>
           Address: ${order.shipping_address}<br>
           City: ${order.shipping_city}<br>
           Phone: ${order.phone}
          </p>
          <p>Please review and confirm the order from your admin dashboard.</p>
        `;
        toEmails.push(storeOwnerEmail);
        break;
      case 'confirmed':
        subject = `Order Confirmed - ${storeName}`;
        html = `
          <h2>Your payment has been verified!</h2>
          <p>Hi ${order.customer_name},</p>
          <p>Great news! We have received your payment and your order <strong>#${orderRef}</strong> is now confirmed. We are currently preparing it for shipping.</p>
          ${adminNote ? `<p><strong>Note from our team:</strong> ${adminNote}</p>` : ''}
          <p>You will receive another update as soon as your parcel is shipped.</p>
          <p>Thank you for shopping with us!</p>
        `;
        break;
      case 'shipped':
        subject = `Your Order has Shipped! - ${storeName}`;
        html = `
          <h2>Your parcel is on the way!</h2>
          <p>Hi ${order.customer_name},</p>
          <p>We are excited to let you know that your order <strong>#${orderRef}</strong> has been shipped.</p>
          <p>It is currently on its way to ${order.shipping_city}. Expected delivery is usually within 3-5 business days from shipment.</p>
          <br>
           <p><strong>Shipping Details:</strong><br>
           Address: ${order.shipping_address}<br>
           City: ${order.shipping_city}
           </p>
          <p>Thank you for your patience!</p>
        `;
        break;
      case 'delivered':
        subject = `Order Delivered! - ${storeName}`;
        html = `
          <h2>Your delivery is complete!</h2>
          <p>Hi ${order.customer_name},</p>
          <p>Your order <strong>#${orderRef}</strong> has been successfully delivered and signed for at your address.</p>
          <p>We hope everything arrived exactly as expected. If you have any issues, please let us know by replying to this email.</p>
          <p>Enjoy your purchase and we hope to see you again soon!</p>
        `;
        break;
      case 'cancelled':
        subject = `Order Cancelled - ${storeName}`;
        html = `
          <h2>Order Cancellation Notice</h2>
          <p>Hi ${order.customer_name},</p>
          <p>We regret to inform you that your order <strong>#${orderRef}</strong> has been cancelled.</p>
          ${adminNote ? `<p><strong>Reason:</strong> ${adminNote}</p>` : ''}
          <p>Please reply to this email if you need any further assistance.</p>
        `;
        break;
      default:
        throw new Error(`Unsupported email type: ${type}`);
    }

    // Try to get customer email (either from order.email or fetching from clerk/auth if not possible directly)
    // NOTE: This assumes the app stores email on the order or the customer is an authenticated user. 
    // In our codebase, maybe there's an email on the order! Wait, let's check order interface in AdminOrders:
    // It has: customer_name, phone, shipping_address, shipping_city, total_amount, etc.
    // It seems there is NO email directly on the order. We must send to the user's email if they have one.
    
    // Attempt to retrieve customer email via Clerk API if user_id is present
    let toEmail = "test@example.com"; 

    if (order.user_id && order.user_id.startsWith('user_') && clerkSecretKey) {
      try {
        const clerkRes = await fetch(`https://api.clerk.com/v1/users/${order.user_id}`, {
          headers: { Authorization: `Bearer ${clerkSecretKey}` }
        });
        if (clerkRes.ok) {
          const userData = await clerkRes.json();
          if (userData.email_addresses && userData.email_addresses.length > 0) {
            toEmail = userData.email_addresses[0].email_address;
          }
        }
      } catch (e) {
        console.error('Failed to fetch clerk user email', e);
      }
    }

    if (type !== 'new_order') {
      toEmails.push(toEmail);
    }
    
    // Only send if there are recipients
    if (toEmails.length === 0) {
      throw new Error('No valid recipients found');
    }

    // Send using Resend
    const payload = {
      from: senderEmail === 'onboarding@resend.dev' ? 'onboarding@resend.dev' : `${storeName} <${senderEmail}>`,
      to: toEmails,
      subject,
      html,
    };
    
    console.log("Sending email with payload:", { ...payload, to: toEmails.join(', ') });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return new Response(
        JSON.stringify({ success: true, message: `Email sent successfully using Resend for ${type}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      const errorResponse = await res.text();
      throw new Error(`Resend error: ${errorResponse}`);
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});