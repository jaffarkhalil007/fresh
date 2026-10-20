import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, Check, Copy, Upload, Image as ImageIcon, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/currency';

const steps = [
  { id: 1, name: 'Shipping' },
  { id: 2, name: 'Payment' },
  { id: 3, name: 'Review' },
];

const JAZZCASH_ACCOUNT = {
  number: '03047683722',
  name: 'Muhammad Jaffar',
};

const EASYPAISA_ACCOUNT = {
  number: '03047683722',
  name: 'Muhammad Jaffar',
};

const SADAPAY_ACCOUNT = {
  number: '03047683722',
  name: 'Muhammad Jaffar',
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { items, buyNowItems, clearCart, clearBuyNowItems } = useCartStore();
  const checkoutItems = buyNowItems ?? items;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Coupon — pre-seeded from Cart page if available, otherwise enter here
  const locationState = location.state ?? {};
  const [appliedCoupon, setAppliedCoupon] = useState<any>(locationState.appliedCoupon ?? null);
  const [couponDiscount, setCouponDiscount] = useState<number>(locationState.discount ?? 0);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', couponCode.trim())
      .single();
    if (error || !data) {
      setCouponError('Invalid coupon code.');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } else if (!data.is_active) {
      setCouponError('This coupon is inactive.');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError('This coupon has expired.');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } else if (data.min_order_amount && subtotal < data.min_order_amount) {
      setCouponError(`Minimum order of ${formatPrice(data.min_order_amount)} required.`);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } else if (data.max_uses && (data.used_count ?? 0) >= data.max_uses) {
      setCouponError('This coupon has reached its usage limit.');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } else {
      const disc = data.discount_type === 'percentage'
        ? Math.round((subtotal * data.discount_value) / 100)
        : data.discount_value;
      setAppliedCoupon(data);
      setCouponDiscount(disc);
      setCouponCode('');
    }
    setIsValidatingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError('');
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'jazzcash' | 'easypaisa' | 'sadapay'>('cod');
  const [tid, setTid] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkoutItems.length === 0 && !isSubmitting) {
      navigate('/cart', { replace: true });
    }
  }, [checkoutItems.length, navigate, isSubmitting]);

  useEffect(() => {
    return () => clearBuyNowItems();
  }, [clearBuyNowItems]);

  const subtotal = checkoutItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const shipping = subtotal > 0 ? (subtotal >= 1000 ? 0 : 150) : 0;
  const total = subtotal + shipping - couponDiscount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      setPaymentScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.city) {
        toast.error('Please fill in all required shipping fields', { className: 'glass !bg-background/80 !border-rose-500/30 !text-foreground' });
        return;
      }
    }
    if (currentStep === 2) {
      if (paymentMethod !== 'cod') {
        if (!tid && !paymentScreenshot) {
          toast.error('Please provide a Transaction ID (TID) or upload payment screenshot proof', { className: 'glass !bg-background/80 !border-rose-500/30 !text-foreground' });
          return;
        }
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!', { className: '!bg-[#fffdfc] !border-[#186049] !text-[#3f393e]' });
  };

  const placeOrder = async () => {
    if (checkoutItems.length === 0) return;
    setIsSubmitting(true);

    try {
      let paymentScreenshotUrl: string | null = null;

      // 1. Upload payment screenshot if attached
      if (paymentScreenshot) {
        const fileExt = paymentScreenshot.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(fileName, paymentScreenshot);

        if (uploadError) {
          throw new Error(`Payment screenshot upload failed: ${uploadError.message}`);
        } else if (uploadData) {
          paymentScreenshotUrl = fileName;
        }
      }

      // 2. Prepare Order DB Payload according to schema
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const fullAddress = `${formData.address}${formData.zipCode ? `, Zip: ${formData.zipCode}` : ''}`;
      const verifiedUserId = user?.id || null;

      const orderPayload = {
        customer_name: fullName,
        phone: formData.phone,
        shipping_address: fullAddress,
        shipping_city: formData.city,
        total_amount: total,
        status: paymentMethod === 'cod' ? 'pending' : 'pending_verification',
        payment_screenshot_url: paymentScreenshotUrl,
        user_id: isUuid(verifiedUserId || '') ? verifiedUserId : null,
        notes: `Email: ${formData.email || 'N/A'} | Payment: ${paymentMethod.toUpperCase()}${tid ? ` | TID: ${tid}` : ''}${appliedCoupon ? ` | Coupon: ${appliedCoupon.code} (-${formatPrice(couponDiscount)})` : ''}${verifiedUserId ? ` [clerk:${verifiedUserId}]` : ''}`
      };

      let order: { id: string } | null = null;

      // 3. Insert into `orders` table
      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (orderError) {
        // Fallback for RLS/Clerk UUID error: retry with user_id: null
        const { data: fallbackOrder, error: fallbackError } = await supabase
          .from('orders')
          .insert({
            ...orderPayload,
            user_id: null
          })
          .select('id')
          .single();

        if (fallbackError) throw fallbackError;
        order = fallbackOrder;
      } else {
        order = createdOrder;
      }

      if (!order?.id) {
        throw new Error('Order creation failed. Please try again.');
      }

      // 4. Insert into `order_items` table
      const orderItemsToInsert = checkoutItems.map((item) => ({
        order_id: order!.id,
        product_id: isUuid(item.product.id) ? item.product.id : null,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) {
        // Delete orphaned order if items fail
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }

      // 5. Best-effort order notification invocation
      try {
        await supabase.functions.invoke('send-order-notification', {
          body: { orderId: order.id, type: 'new_order' }
        });
      } catch (e) {
        console.log('Notification trigger non-blocking error:', e);
      }

      // 6. Increment coupon used_count (best-effort, non-blocking)
      if (appliedCoupon) {
        try {
          await supabase
            .from('coupons')
            .update({ used_count: (appliedCoupon.used_count ?? 0) + 1 })
            .eq('id', appliedCoupon.id);
        } catch (e) {
          console.log('Coupon usage increment non-blocking error:', e);
        }
      }

      // 6. Complete Order
      if (buyNowItems) {
        clearBuyNowItems();
      } else {
        clearCart();
      }
      toast.success('Order placed successfully!', { className: '!bg-[#fffdfc] !border-[#186049] !text-[#3f393e]' });
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (error: any) {
      console.error('Order placement error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.', { className: 'glass !bg-background/80 !border-rose-500/30 !text-foreground' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdfc] selection:bg-[#d9e7e3]">

      <header className="border-b border-[#eee9eb] bg-white/95 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Link to="/" className="font-serif text-2xl tracking-[0.08em] text-[#242024]">
            HAMAASH
          </Link>
          <div className="flex items-center gap-2 text-sm font-medium text-[#777077]">
            <ShieldCheck className="h-4 w-4 text-[#186049]" />
            Secure Checkout
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 lg:py-16">
        <div className="mx-auto max-w-[1100px] px-4 md:px-8">
          
          <div className="mx-auto mb-12 max-w-2xl">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 top-1/2 z-0 h-px w-full -translate-y-1/2 bg-[#e8e3e5]" />
              <div className="absolute left-0 top-1/2 z-0 h-0.5 -translate-y-1/2 bg-[#186049] transition-all duration-500" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />
              
              {steps.map((step) => (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-[#fffdfc] px-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ${currentStep >= step.id ? 'border-[#186049] bg-[#186049] text-white' : 'border-[#d8cfd3] bg-white text-[#9a9298]'}`}>
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : <span className="font-bold text-sm">{step.id}</span>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${currentStep >= step.id ? 'text-[#186049]' : 'text-[#9a9298]'}`}>{step.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            
            {/* Main Form Area */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="border-t border-[#e8e3e5] bg-white p-6 md:p-8">
                      <h2 className="mb-8 font-serif text-3xl text-[#242024]">Shipping Information</h2>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">First Name *</label>
                          <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="h-12 w-full border border-[#d8cfd3] bg-[#fffdfc] px-4 text-[#3f393e] outline-none transition-colors focus:border-[#186049]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">Last Name *</label>
                          <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-12 w-full border border-[#d8cfd3] bg-[#fffdfc] px-4 text-[#3f393e] outline-none transition-colors focus:border-[#186049]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">Email Address *</label>
                          <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="h-12 w-full border border-[#d8cfd3] bg-[#fffdfc] px-4 text-[#3f393e] outline-none transition-colors focus:border-[#186049]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">Phone Number *</label>
                          <input name="phone" value={formData.phone} onChange={handleInputChange} className="h-12 w-full border border-[#d8cfd3] bg-[#fffdfc] px-4 text-[#3f393e] outline-none transition-colors focus:border-[#186049]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">Street Address *</label>
                          <input name="address" value={formData.address} onChange={handleInputChange} className="h-12 w-full border border-[#d8cfd3] bg-[#fffdfc] px-4 text-[#3f393e] outline-none transition-colors focus:border-[#186049]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">City *</label>
                          <input name="city" value={formData.city} onChange={handleInputChange} className="h-12 w-full border border-[#d8cfd3] bg-[#fffdfc] px-4 text-[#3f393e] outline-none transition-colors focus:border-[#186049]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">Zip Code</label>
                          <input name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="h-12 w-full border border-[#d8cfd3] bg-[#fffdfc] px-4 text-[#3f393e] outline-none transition-colors focus:border-[#186049]" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="border-t border-[#e8e3e5] bg-white p-6 md:p-8">
                      <h2 className="mb-8 font-serif text-3xl text-[#242024]">Payment Method</h2>
                      <div className="mb-8 grid gap-3">
                        {[
                          { id: 'cod', name: 'Cash on Delivery', desc: 'Pay when you receive' },
                          { id: 'jazzcash', name: 'JazzCash', desc: 'Instant mobile transfer' },
                          { id: 'easypaisa', name: 'EasyPaisa', desc: 'Instant mobile transfer' },
                          { id: 'sadapay', name: 'SadaPay', desc: 'Bank transfer' }
                        ].map((method) => (
                          <div 
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={`cursor-pointer border p-4 transition-all ${paymentMethod === method.id ? 'border-[#186049] bg-[#e3f0ea]' : 'border-[#e8e3e5] hover:border-[#d8cfd3] hover:bg-[#fffdfc]'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === method.id ? 'border-[#186049]' : 'border-[#d8cfd3]'}`}>
                                {paymentMethod === method.id && <div className="h-2.5 w-2.5 rounded-full bg-[#186049]" />}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-[#3f393e]">{method.name}</div>
                                <div className="text-[10px] uppercase tracking-widest text-[#9a9298]">{method.desc}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <AnimatePresence>
                        {paymentMethod !== 'cod' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="relative mb-6 border-t border-[#e8e3e5] bg-[#f4f0ed] p-6">
                              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#186049]">Transfer Details</h3>
                              
                              <div className="space-y-4 mb-6">
                                {paymentMethod === 'jazzcash' && (
                                  <>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-[#9a9298]">Account Title:</span>
                                      <span className="font-medium text-[#3f393e]">{JAZZCASH_ACCOUNT.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-[#9a9298]">JazzCash Number:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-[#186049]">{JAZZCASH_ACCOUNT.number}</span>
                                        <button onClick={() => copyToClipboard(JAZZCASH_ACCOUNT.number)} className="rounded p-1 hover:bg-[#eee9eb]"><Copy className="h-4 w-4 text-[#9a9298]" /></button>
                                      </div>
                                    </div>
                                  </>
                                )}
                                {paymentMethod === 'easypaisa' && (
                                  <>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-[#9a9298]">Account Title:</span>
                                      <span className="font-medium text-[#3f393e]">{EASYPAISA_ACCOUNT.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-[#9a9298]">EasyPaisa Number:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-[#186049]">{EASYPAISA_ACCOUNT.number}</span>
                                        <button onClick={() => copyToClipboard(EASYPAISA_ACCOUNT.number)} className="rounded p-1 hover:bg-[#eee9eb]"><Copy className="h-4 w-4 text-[#9a9298]" /></button>
                                      </div>
                                    </div>
                                  </>
                                )}
                                {paymentMethod === 'sadapay' && (
                                  <>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-[#9a9298]">Account Title:</span>
                                      <span className="font-medium text-[#3f393e]">{SADAPAY_ACCOUNT.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-[#9a9298]">SadaPay IBAN / Phone:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-[#186049]">{SADAPAY_ACCOUNT.number}</span>
                                        <button onClick={() => copyToClipboard(SADAPAY_ACCOUNT.number)} className="rounded p-1 hover:bg-[#eee9eb]"><Copy className="h-4 w-4 text-[#9a9298]" /></button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">Transaction ID (TID)</label>
                                  <input value={tid} onChange={(e) => setTid(e.target.value)} placeholder="e.g. 0123456789" className="h-12 w-full border border-[#d8cfd3] bg-white px-4 text-[#3f393e] outline-none focus:border-[#186049]" />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#777077]">Upload Payment Proof (Screenshot)</label>
                                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-[#d8cfd3] p-4 text-center transition-all hover:border-[#186049] hover:bg-white"
                                  >
                                    {previewUrl ? (
                                      <div className="flex items-center gap-3">
                                        <img src={previewUrl} alt="Screenshot proof" className="h-16 w-16 rounded-lg border border-[#186049] object-cover" />
                                        <div className="text-left">
                                          <div className="text-xs font-bold text-[#186049]">Screenshot Uploaded</div>
                                          <div className="text-[10px] text-[#9a9298]">Click to replace</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <Upload className="h-6 w-6 text-[#186049]" />
                                        <div className="text-xs font-medium text-[#5f595d]">Click to select screenshot image</div>
                                        <div className="text-[10px] text-[#9a9298]">PNG, JPG up to 5MB</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="border-t border-[#e8e3e5] bg-white p-6 md:p-8">
                      <h2 className="mb-8 font-serif text-3xl text-[#242024]">Review Order</h2>
                      <div className="space-y-8">
                        <div>
                          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#186049]">Shipping Details</h3>
                          <div className="border-t border-[#e8e3e5] bg-[#f4f0ed] p-4 text-sm leading-relaxed text-[#777077]">
                            <span className="font-medium text-[#3f393e]">{formData.firstName} {formData.lastName}</span><br />
                            {formData.address}, {formData.city} {formData.zipCode}<br />
                            {formData.phone}<br />
                            {formData.email}
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#186049]">Payment Method</h3>
                          <div className="border-t border-[#e8e3e5] bg-[#f4f0ed] p-4 text-sm text-[#777077]">
                            <span className="font-medium uppercase text-[#3f393e]">{paymentMethod}</span>
                            {paymentMethod !== 'cod' && (
                              <div className="mt-1 flex flex-col gap-1">
                                {tid && <div>TID: <span className="font-mono text-[#186049]">{tid}</span></div>}
                                {paymentScreenshot && <div className="flex items-center gap-1 text-xs text-[#186049]"><ImageIcon className="h-3 w-3" /> Screenshot proof attached</div>}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#186049]">Items ({checkoutItems.length})</h3>
                          <div className="space-y-3">
                            {checkoutItems.map((item) => (
                              <div key={item.product.id} className="flex items-center gap-4 border-t border-[#e8e3e5] py-3">
                                <div className="flex h-14 w-14 items-center justify-center overflow-hidden bg-[#f4f0ed] p-1">
                                  <img src={item.product.imageUrl} alt={item.product.name} className="max-h-full max-w-full object-contain" />
                                </div>
                                <div className="flex-1">
                                  <div className="line-clamp-1 text-sm font-medium text-[#3f393e]">{item.product.name}</div>
                                  <div className="text-xs text-[#9a9298]">Qty: {item.quantity} × {formatPrice(item.product.price)}</div>
                                </div>
                                <div className="text-sm font-bold text-[#186049]">
                                  {formatPrice(item.product.price * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-[#f4f0ed] p-6 md:p-8">
                <h3 className="mb-6 font-serif text-3xl text-[#242024]">Order Summary</h3>
                <div className="mb-6 space-y-4 text-sm text-[#777077]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#3f393e]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium text-[#3f393e]">
                      {shipping === 0 ? <span className="text-[#186049]">Free</span> : formatPrice(shipping)}
                    </span>
                  </div>
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span className="font-semibold">− {formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Input */}
                <div className="mb-6 border-t border-[#e3dadd] pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#716b70]">Promo Code</p>
                  <AnimatePresence mode="wait">
                    {appliedCoupon ? (
                      <motion.div
                        key="applied"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-mono text-xs font-bold text-emerald-700">{appliedCoupon.code}</span>
                        </div>
                        <button onClick={removeCoupon} className="rounded p-0.5 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700" aria-label="Remove coupon">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                        <input
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter code"
                          className="flex-1 border border-[#d8cfd3] bg-white px-3 py-2 font-mono text-xs uppercase tracking-wider text-[#3f393e] outline-none transition-colors focus:border-[#186049]"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponCode.trim()}
                          className="shrink-0 bg-[#242024] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#3f393e] disabled:opacity-50"
                        >
                          {isValidatingCoupon ? '...' : 'Apply'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {couponError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-xs text-rose-500">
                      {couponError}
                    </motion.p>
                  )}
                  {appliedCoupon && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-xs text-emerald-600">
                      ✓ {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% off applied!` : `${formatPrice(appliedCoupon.discount_value)} off applied!`}
                    </motion.p>
                  )}
                </div>
                <div className="mb-8 border-t border-[#e3dadd] pt-6">
                  <div className="flex items-end justify-between">
                    <span className="font-medium text-[#3f393e]">Total</span>
                    <span className="font-serif text-3xl text-[#186049]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="flex h-14 items-center justify-center border border-[#d8cfd3] bg-white px-6 text-[#777077] transition-colors hover:bg-[#fffdfc] hover:text-[#3f393e] disabled:opacity-50"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}
                  
                    <button
                      onClick={currentStep === steps.length ? placeOrder : handleNext}
                      disabled={isSubmitting}
                      className="flex h-14 w-full items-center justify-center gap-2 bg-[#242024] text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : currentStep === steps.length ? (
                        <>Place Order <Check className="ml-1 h-5 w-5" /></>
                      ) : (
                        <>Continue <ArrowRight className="ml-1 h-5 w-5" /></>
                      )}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;