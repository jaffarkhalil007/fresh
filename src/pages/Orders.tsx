import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, ChevronRight, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { callAdminData } from '@/lib/adminData';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { formatPrice } from '@/lib/currency';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];

const statusColors: Record<string, string> = {
  pending_verification: 'text-[#9a6b1f] bg-[#faf3e3]',
  pending: 'text-[#9a6b1f] bg-[#faf3e3]',
  confirmed: 'text-[#3d5a80] bg-[#e8eef6]',
  shipped: 'text-[#6b4a8a] bg-[#f0e9f5]',
  delivered: 'text-[#3d6b4f] bg-[#e6f2ea]',
  cancelled: 'text-[#186049] bg-[#e3f0ea]',
};

const statusLabels: Record<string, string> = {
  pending_verification: 'Verification',
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const { data, error } = await callAdminData({
        table: 'user_orders',
        userId: user.id,
        userName: user.user_metadata?.full_name || '',
      });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    };

    if (user) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fffdfc]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#186049]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fffdfc] selection:bg-[#d9e7e3]">
      <Header />

      <main className="flex-1 pb-24 pt-[50px] md:pt-24 lg:pt-36">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <div className="mb-10 flex items-center gap-3">
            <h1 className="font-serif text-4xl text-[#242024] md:text-5xl">Order History</h1>
            {orders.length > 0 && (
              <span className="bg-[#f4f0ed] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#186049]">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#186049]" />
            </div>
          ) : orders.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#f4f0ed] text-[#c7bdc1]">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h2 className="mb-4 font-serif text-3xl text-[#242024]">No orders yet</h2>
              <p className="mb-8 text-sm leading-relaxed text-[#777077]">
                You haven't placed any orders. Start shopping to discover our collection.
              </p>
              <Link
                to="/products"
                className="bg-[#242024] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="group block border border-[#e8e3e5] bg-white p-5 transition-colors hover:border-[#186049]/50 md:p-6"
                >
                  <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f0ed] text-[#186049]">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9a9298]">Order Number</p>
                        <p className="font-mono text-base text-[#242024]">#{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex w-fit items-center px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusColors[order.status] || 'text-[#5f595d] bg-[#f4f0ed]'}`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 border-y border-[#e8e3e5] py-5 md:grid-cols-4">
                    <div>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9a9298]">Date</p>
                      <p className="text-sm text-[#3f393e]">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9a9298]">Total Amount</p>
                      <p className="font-semibold text-[#186049]">{formatPrice(Number(order.total_amount))}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9a9298]">Shipping To</p>
                      <p className="line-clamp-1 text-sm text-[#5f595d]">
                        {order.shipping_city}, {order.shipping_address}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end text-sm font-medium text-[#777077] transition-colors group-hover:text-[#186049]">
                    View Details
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
