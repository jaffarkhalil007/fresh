import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, LogOut, 
  Menu, X, TrendingUp, DollarSign, ShoppingBag, Percent, Tag,
  LayoutGrid, MessageSquare, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminDiscountSettings from '@/components/admin/AdminDiscountSettings';
import AdminCoupons from '@/components/admin/AdminCoupons';
import AdminCustomers from '@/components/admin/AdminCustomers';
import AdminChatInbox from '@/components/admin/AdminChatInbox';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminBanners from '@/components/admin/AdminBanners';

type TabType = 'dashboard' | 'products' | 'categories' | 'banners' | 'orders' | 'discounts' | 'coupons' | 'customers' | 'chats';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

const AdminDashboard = () => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch orders stats
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status');

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
        pendingOrders,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products' as TabType, label: 'Products', icon: Package },
    { id: 'categories' as TabType, label: 'Categories', icon: LayoutGrid },
    { id: 'banners' as TabType, label: 'Banners', icon: Image },
    { id: 'orders' as TabType, label: 'Orders', icon: ShoppingCart },
    { id: 'chats' as TabType, label: 'Support Chats', icon: MessageSquare },
    { id: 'coupons' as TabType, label: 'Coupons', icon: Tag },
    { id: 'discounts' as TabType, label: 'Discounts', icon: Percent },
    { id: 'customers' as TabType, label: 'Customers', icon: Users },
  ];

  return (
    <div className="admin-shell min-h-screen bg-[#fffdfc] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#fffdfc] transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-[#e8e3e5]">
            <h1 className="font-serif text-xl tracking-[0.08em] text-[#242024]">HAMAASH</h1>
            <button className="lg:hidden text-[#4e484d]" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#a35d70] text-white shadow-sm'
                    : 'text-[#716b70] hover:bg-[#f4dfe3] hover:text-[#8f4f60]'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-[#e8e3e5]">
            <Button
              variant="ghost"
              className="w-full justify-start text-[#716b70] hover:text-[#8f4f60] hover:bg-[#f4dfe3]"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="h-20 bg-[#fffdfc]/95 backdrop-blur-xl border-b border-[#e8e3e5] flex items-center justify-between px-6">
          <button className="lg:hidden text-[#4e484d]" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a9298]">Welcome, Admin</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-5 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a35d70]">Store overview</p>
                <h2 className="mt-2 font-serif text-4xl text-[#242024]">Dashboard</h2>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="admin-stat-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
                  </CardContent>
                </Card>

                <Card className="admin-stat-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.totalOrders}</div>
                  </CardContent>
                </Card>

                <Card className="admin-stat-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{formatPrice(stats.totalRevenue)}</div>
                  </CardContent>
                </Card>

                <Card className="admin-stat-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Pending Orders</CardTitle>
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.pendingOrders}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'banners' && <AdminBanners />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'chats' && <AdminChatInbox />}
          {activeTab === 'coupons' && <AdminCoupons />}
          {activeTab === 'discounts' && <AdminDiscountSettings />}
          {activeTab === 'customers' && <AdminCustomers />}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
