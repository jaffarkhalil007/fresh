import { supabase } from '@/integrations/supabase/client';

type AdminBody = Record<string, any>;

async function syncProductRating(productId: string) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);
  const count = reviews?.length ?? 0;
  const avg = count > 0 ? reviews!.reduce((s, r) => s + r.rating, 0) / count : 0;
  await supabase
    .from('products')
    .update({ rating: Math.round(avg * 10) / 10, review_count: count })
    .eq('id', productId);
}

/**
 * Edge function admin-data is not deployed on this project (CORS 404).
 * Same actions run against PostgREST instead.
 */
export async function callAdminData(body: AdminBody) {
  const action = body.action || 'read';
  const table = body.table || 'profiles';

  if (table === 'user_orders') {
    const userId = body.userId as string | undefined;
    const userName = (body.userName || '').toLowerCase().trim();
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    const myOrders = (orders || []).filter((o: any) => {
      if (userId && o.user_id === userId) return true;
      if (o.notes && userId && o.notes.includes(`[clerk:${userId}]`)) return true;
      const dbName = (o.customer_name || '').toLowerCase().trim();
      if (dbName && userName && (dbName === userName || dbName.includes(userName))) return true;
      return false;
    });
    return { data: myOrders, error: null };
  }

  if (action === 'create_review') {
    const { data, error } = await supabase.from('reviews').insert(body.reviewData).select().single();
    if (!error && data) await syncProductRating(body.reviewData.product_id);
    return { data, error };
  }

  if (action === 'delete_review') {
    const { data, error } = await supabase.from('reviews').delete().eq('id', body.reviewId).select();
    if (!error && data?.length) await syncProductRating(data[0].product_id);
    return { data, error };
  }

  if (action === 'update_order') {
    const { data, error } = await supabase.from('orders').update(body.updateData).eq('id', body.orderId).select();
    return { data, error };
  }

  if (action === 'create_product') {
    const { data, error } = await supabase.from('products').insert(body.productData).select();
    return { data, error };
  }

  if (action === 'update_product') {
    const { data, error } = await supabase.from('products').update(body.productData).eq('id', body.productId).select();
    return { data, error };
  }

  if (action === 'update_settings') {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ key: body.key, value: body.value }, { onConflict: 'key' });
    return { data, error };
  }

  if (action === 'delete_product') {
    const { data, error } = await supabase.from('products').delete().eq('id', body.productId).select();
    return { data, error };
  }

  if (action === 'delete_all_products') {
    const { data, error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return { data, error };
  }

  if (table === 'profiles') {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return { data: data || [], error };
  }

  if (table === 'orders') {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    return { data: data || [], error };
  }

  return { data: null, error: new Error('Invalid table/action request') };
}
