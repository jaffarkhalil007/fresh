import { useState, useEffect } from 'react';
import { Search, Eye, ChevronDown, CheckCircle, Image as ImageIcon, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { callAdminData } from '@/lib/adminData';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { format } from 'date-fns';

type OrderStatus = 'pending_verification' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  shipping_address: string;
  shipping_city: string;
  total_amount: number;
  quantity: number;
  status: OrderStatus;
  notes: string | null;
  admin_note: string | null;
  created_at: string;
  payment_screenshot_url: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

const statusColors: Record<OrderStatus, string> = {
  pending_verification: 'bg-orange-500',
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-cyan-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusOptions: OrderStatus[] = ['pending_verification', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const TAB_DEFS: { value: string; label: string; status?: OrderStatus }[] = [
  { value: 'all',                  label: 'All' },
  { value: 'pending_verification', label: 'Pending Verification', status: 'pending_verification' },
  { value: 'pending',              label: 'Pending',              status: 'pending' },
  { value: 'confirmed',            label: 'Confirmed',            status: 'confirmed' },
  { value: 'processing',           label: 'Processing',           status: 'processing' },
  { value: 'shipped',              label: 'Shipped',              status: 'shipped' },
  { value: 'delivered',            label: 'Delivered',            status: 'delivered' },
  { value: 'cancelled',            label: 'Cancelled',            status: 'cancelled' },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending_verification');

  const tabOrdersFor = (tabValue: string) =>
    tabValue === 'all'
      ? orders
      : orders.filter(o => o.status === tabValue);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await callAdminData({ table: 'orders' });

      if (error) throw error;

      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity');

      if (orderItemsError) throw orderItemsError;

      const quantitiesByOrderId = (orderItems || []).reduce<Record<string, number>>(
        (totals, item) => {
          totals[item.order_id] = (totals[item.order_id] || 0) + item.quantity;
          return totals;
        },
        {},
      );

      setOrders(
        (data || []).map((order) => ({
          ...order,
          quantity: quantitiesByOrderId[order.id] || 0,
        })),
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
      toast.error('Failed to load order details');
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    
    // Fetch screenshot URL if exists
    if (order.payment_screenshot_url) {
      const { data, error } = await supabase.storage
        .from('payment-screenshots')
        .createSignedUrl(order.payment_screenshot_url, 60 * 60);

      if (error) {
        console.error('Error loading payment screenshot:', error);
        setScreenshotUrl(null);
        toast.error('Payment screenshot could not be loaded. Check storage bucket policies.');
      } else {
        setScreenshotUrl(data.signedUrl);
      }
    } else {
      setScreenshotUrl(null);
    }
    
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      let adminNoteAdd = "";
      if (newStatus === 'shipped') {
         const days = window.prompt("Estimated delivery days?", "3");
         if (days !== null && !isNaN(Number(days))) {
            const deliveryPayload = {
               estimatedDeliveryDate: new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString()
            };
            adminNoteAdd = JSON.stringify(deliveryPayload);
         }
      }

      const updateData: any = { status: newStatus };
      if (adminNoteAdd) {
         updateData.admin_note = adminNoteAdd;
      }

      const { error } = await callAdminData({
        action: 'update_order',
        orderId,
        updateData,
      });

      if (error) throw error;
      
      // Update local state without waiting for full refetch
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      // Send email notification for important status changes
      if (['shipped', 'delivered', 'cancelled'].includes(newStatus)) {
        try {
          await supabase.functions.invoke('send-order-notification', {
            body: {
              orderId,
              type: newStatus
            }
          });
        } catch (emailError) {
          console.error(`Failed to send ${newStatus} email notification:`, emailError);
        }
      }
      
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      fetchOrders();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleApprovePayment = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await callAdminData({
        action: 'update_order',
        orderId,
        updateData: {
          status: 'confirmed',
          admin_note: adminNote.trim() || null,
        },
      });

      if (error) throw error;
      
      // Update local state without waiting for full refetch
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'confirmed', admin_note: adminNote.trim() || null } : o));

      // Send email notification
      try {
        await supabase.functions.invoke('send-order-notification', {
          body: {
            orderId,
            type: 'confirmed',
            adminNote: adminNote.trim() || undefined
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the whole operation if email fails
      }
      
      toast.success('Payment approved successfully');
      setAdminNote('');
      fetchOrders();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async (orderId: string) => {
    if (!adminNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    try {
      const { error } = await callAdminData({
        action: 'update_order',
        orderId,
        updateData: {
          status: 'cancelled',
          admin_note: adminNote.trim()
        }
      });

      if (error) throw error;
      
      // Update local state without waiting for full refetch
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled', admin_note: adminNote.trim() } : o));

      // Send email notification
      try {
        await supabase.functions.invoke('send-order-notification', {
          body: {
            orderId,
            type: 'cancelled',
            adminNote: adminNote.trim()
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the whole operation if email fails
      }
      
      toast.success('Payment rejected');
      setAdminNote('');
      fetchOrders();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setIsProcessing(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderOrdersTable = (orderList: Order[]) => (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-700">
          <TableHead className="text-slate-300">Order ID</TableHead>
          <TableHead className="text-slate-300">Customer</TableHead>
          <TableHead className="text-slate-300">City</TableHead>
          <TableHead className="text-slate-300">Quantity</TableHead>
          <TableHead className="text-slate-300">Amount</TableHead>
          <TableHead className="text-slate-300">Status</TableHead>
          <TableHead className="text-slate-300">Date</TableHead>
          <TableHead className="text-slate-300 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderList
          .filter(order =>
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.phone.includes(searchQuery) ||
            order.id.includes(searchQuery)
          )
          .map((order) => (
          <TableRow key={order.id} className="border-slate-700">
            <TableCell className="text-slate-300 font-mono text-sm">
              {order.id.slice(0, 8)}...
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium text-foreground">{order.customer_name}</p>
                <p className="text-xs text-slate-400">{order.phone}</p>
              </div>
            </TableCell>
            <TableCell className="text-slate-300">{order.shipping_city}</TableCell>
            <TableCell className="text-slate-300">{order.quantity}</TableCell>
            <TableCell className="text-slate-300">{formatPrice(order.total_amount)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Badge className={statusColors[order.status]}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {statusOptions.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleUpdateStatus(order.id, status)}
                      className="capitalize"
                    >
                      {status.replace('_', ' ')}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
            <TableCell className="text-slate-300">
              {format(new Date(order.created_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="text-right space-x-2">
              {order.status === 'pending_verification' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleViewOrder(order)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Review
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewOrder(order)}
                className="text-slate-400 hover:text-foreground"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {orderList.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-slate-400 py-8">
              No orders found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Orders</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-600 text-foreground w-64"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex min-w-max gap-1 bg-slate-800 p-1">
            {TAB_DEFS.map((tab) => {
              const count = tabOrdersFor(tab.value).length;
              const isVerification = tab.value === 'pending_verification';
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`whitespace-nowrap text-xs data-[state=active]:text-white ${
                    isVerification
                      ? 'data-[state=active]:bg-orange-600'
                      : tab.value === 'all'
                      ? 'data-[state=active]:bg-slate-600'
                      : tab.value === 'pending'
                      ? 'data-[state=active]:bg-yellow-600'
                      : tab.value === 'confirmed'
                      ? 'data-[state=active]:bg-blue-600'
                      : tab.value === 'processing'
                      ? 'data-[state=active]:bg-cyan-600'
                      : tab.value === 'shipped'
                      ? 'data-[state=active]:bg-purple-600'
                      : tab.value === 'delivered'
                      ? 'data-[state=active]:bg-green-600'
                      : 'data-[state=active]:bg-red-600'
                  }`}
                >
                  {isVerification && <AlertCircle className="mr-1.5 h-3.5 w-3.5 shrink-0" />}
                  {tab.label}
                  <span className="ml-1.5 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-200">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {TAB_DEFS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-0">
                {renderOrdersTable(tabOrdersFor(tab.value))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-[#e8e3e5] bg-[#fffdfc] p-0 text-[#242024] shadow-[0_24px_80px_rgba(36,32,36,0.2)] sm:rounded-3xl">
          <div className="border-b border-[#e8e3e5] bg-[#f4f0ed] px-5 py-5 sm:px-8">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-normal text-[#242024]">Order Details</DialogTitle>
          </DialogHeader>
          </div>
          {selectedOrder && (
            <div className="space-y-6 px-5 py-6 sm:px-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9298]">Order ID</p>
                  <p className="break-all font-mono text-sm text-[#3f393e]">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9298]">Date</p>
                  <p className="text-sm text-[#3f393e]">{format(new Date(selectedOrder.created_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9298]">Customer</p>
                  <p className="text-sm font-medium text-[#3f393e]">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9298]">Phone</p>
                  <p className="text-sm text-[#3f393e]">{selectedOrder.phone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9298]">Shipping Address</p>
                  <p className="text-sm leading-relaxed text-[#3f393e]">{selectedOrder.shipping_address}, {selectedOrder.shipping_city}</p>
                </div>
                {selectedOrder.notes && (
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9298]">Notes</p>
                    <p className="text-sm leading-relaxed text-[#3f393e]">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment Screenshot Section */}
              {selectedOrder.status === 'pending_verification' && (
                <div className="rounded-2xl border border-[#c97685]/50 bg-[#fdf3f4] p-4 sm:p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#a35d70]">
                    <ImageIcon className="h-5 w-5" />
                    Payment Screenshot (JazzCash)
                  </h4>
                  {screenshotUrl ? (
                    <div className="space-y-4">
                      <img 
                        src={screenshotUrl} 
                        alt="Payment screenshot" 
                        className="max-h-72 max-w-full rounded-xl border border-[#e3dadd] object-contain shadow-sm"
                      />
                      
                      <div className="space-y-2">
                        <Label htmlFor="adminNote" className="text-xs font-medium text-[#5f595d]">
                          Admin Note (optional for approval, required for rejection)
                        </Label>
                        <Textarea
                          id="adminNote"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Add a note for the customer (e.g., reason for rejection, payment confirmation details...)"
                          className="border-[#d8cfd3] bg-white text-[#242024] placeholder:text-[#9a9298] focus-visible:ring-[#c97685]"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleApprovePayment(selectedOrder.id)}
                          className="flex-1 bg-[#a35d70] text-white hover:bg-[#8f4f60]"
                          disabled={isProcessing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Payment
                        </Button>
                        <Button 
                          onClick={() => handleRejectPayment(selectedOrder.id)}
                          variant="destructive"
                          className="flex-1"
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Payment
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#9a9298]">No screenshot uploaded</p>
                  )}
                </div>
              )}

              {/* Show admin note if exists */}
              {selectedOrder.admin_note && (
                <div className="rounded-2xl border border-[#d8cfd3] bg-[#f4f0ed] p-4">
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#a35d70]">Admin Note</h4>
                  <p className="text-sm leading-relaxed text-[#5f595d]">{selectedOrder.admin_note}</p>
                </div>
              )}

              <div>
                <h4 className="mb-3 font-serif text-2xl font-normal text-[#242024]">Order Items</h4>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#e8e3e5] bg-white p-4">
                      <div>
                        <p className="font-medium text-[#3f393e]">{item.product_name}</p>
                        <p className="text-sm text-[#9a9298]">Qty: {item.quantity}</p>
                      </div>
                      <p>{formatPrice(item.product_price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-start justify-between gap-3 border-t border-[#e8e3e5] pt-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#9a9298]">Status:</span>
                  <Badge className={statusColors[selectedOrder.status]}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9298]">Total Amount</p>
                  <p className="text-2xl font-semibold text-[#a35d70]">{formatPrice(selectedOrder.total_amount)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
