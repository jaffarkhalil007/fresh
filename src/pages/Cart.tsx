import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, ArrowRight, ShoppingBag, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number | null;
  is_active: boolean | null;
  expires_at: string | null;
}

const Cart = () => {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const subtotal = getTotalPrice();
  const shipping = subtotal > 0 ? (subtotal >= 1000 ? 0 : 150) : 0;

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const discount = appliedCoupon
    ? appliedCoupon.discount_type === 'percentage'
      ? Math.round((subtotal * appliedCoupon.discount_value) / 100)
      : appliedCoupon.discount_value
    : 0;

  const total = subtotal + shipping - discount;
  const progressToFreeShipping = Math.min((subtotal / 1000) * 100, 100);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    setCouponError('');

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', couponCode.trim())
      .single();

    if (error || !data) {
      setCouponError('Invalid coupon code. Please check and try again.');
      setAppliedCoupon(null);
    } else if (!data.is_active) {
      setCouponError('This coupon is currently inactive.');
      setAppliedCoupon(null);
    } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError('This coupon has expired.');
      setAppliedCoupon(null);
    } else if (data.min_order_amount && subtotal < data.min_order_amount) {
      setCouponError(`Minimum order of ${formatPrice(data.min_order_amount)} required to use this coupon.`);
      setAppliedCoupon(null);
    } else if (data.max_uses && (data.used_count ?? 0) >= data.max_uses) {
      setCouponError('This coupon has reached its usage limit.');
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(data as Coupon);
      setCouponCode('');
    }
    setIsValidating(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fffdfc] selection:bg-[#d9e7e3]">
      <Header />

      <main className="flex-1 pb-24 pt-[50px] md:pt-24 lg:pt-36">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex items-center gap-3"
          >
            <h1 className="font-serif text-4xl text-[#242024] md:text-5xl">Your Cart</h1>
            <span className="bg-[#f4f0ed] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#186049]">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </motion.div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#f4f0ed] text-[#c7bdc1]">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h2 className="mb-4 font-serif text-3xl text-[#242024]">Your cart is empty</h2>
              <p className="mb-8 text-sm leading-relaxed text-[#777077]">
                Looks like you haven't added anything to your cart yet. Discover our premium collection.
              </p>
              <Link to="/products" className="bg-[#242024] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5">
                  Explore Products
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="group flex gap-4 border-t border-[#e8e3e5] py-5 md:gap-6">
                        <Link to={`/product/${item.product.id}`} className="relative h-24 w-24 shrink-0 overflow-hidden bg-[#f4f0ed] p-2">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
                          />
                        </Link>
                        
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="flex justify-between gap-4">
                            <div>
                              <Link to={`/product/${item.product.id}`} className="line-clamp-1 font-medium text-[#3f393e] transition-colors hover:text-[#186049]">
                                {item.product.name}
                              </Link>
                              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9a9298]">
                                {item.product.category}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-[#186049]">
                                {formatPrice(item.product.price)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex h-9 w-28 items-center justify-between border border-[#d8cfd3] bg-white px-1">
                              <button
                                className="flex h-7 w-7 items-center justify-center text-[#3f393e] transition-colors hover:bg-[#eee9eb] disabled:opacity-50"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium text-[#3f393e]">{item.quantity}</span>
                              <button
                                className="flex h-7 w-7 items-center justify-center text-[#3f393e] transition-colors hover:bg-[#eee9eb]"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="flex h-9 w-9 items-center justify-center text-[#9a9298] transition-colors hover:bg-[#e3f0ea] hover:text-[#186049]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link to="/products" className="mt-4 inline-flex items-center text-sm font-medium text-[#777077] transition-colors hover:text-[#186049]">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </Link>
                </motion.div>
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="h-fit lg:sticky lg:top-36"
              >
                <div className="bg-[#f4f0ed] p-6 md:p-8">
                  <h3 className="mb-6 font-serif text-3xl text-[#242024]">Order Summary</h3>

                  {/* Free Shipping Progress */}
                  <div className="mb-6 border-t border-[#e3dadd] pt-4">
                    <div className="mb-3 flex justify-between text-sm">
                      <span className="font-medium text-[#5f595d]">Free Shipping Progress</span>
                      <span className="font-bold text-[#186049]">{Math.round(progressToFreeShipping)}%</span>
                    </div>
                    <div className="mb-2 h-1.5 w-full overflow-hidden bg-white">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToFreeShipping}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-[#186049]"
                      />
                    </div>
                    {subtotal >= 1000 ? (
                      <p className="text-xs text-[#186049]">You've unlocked free shipping!</p>
                    ) : (
                      <p className="text-xs text-[#9a9298]">
                        Add <span className="text-[#3f393e]">Rs. {1000 - subtotal}</span> more for free shipping
                      </p>
                    )}
                  </div>

                  {/* Coupon Code */}
                  <div className="mb-6 border-t border-[#e3dadd] pt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#716b70]">
                      Promo Code
                    </p>
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
                          <button
                            onClick={removeCoupon}
                            className="rounded p-0.5 text-emerald-500 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
                            aria-label="Remove coupon"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="input"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex gap-2"
                        >
                          <input
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="Enter code"
                            className="flex-1 border border-[#d8cfd3] bg-white px-3 py-2 font-mono text-xs uppercase tracking-wider text-[#3f393e] outline-none transition-colors focus:border-[#186049]"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={isValidating || !couponCode.trim()}
                            className="shrink-0 bg-[#242024] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#3f393e] disabled:opacity-50"
                          >
                            {isValidating ? '...' : 'Apply'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {couponError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-xs text-rose-500"
                      >
                        {couponError}
                      </motion.p>
                    )}
                    {appliedCoupon && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-xs text-emerald-600"
                      >
                        ✓ {appliedCoupon.discount_type === 'percentage'
                          ? `${appliedCoupon.discount_value}% off applied!`
                          : `${formatPrice(appliedCoupon.discount_value)} off applied!`}
                      </motion.p>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="mb-6 space-y-3 text-sm text-[#777077]">
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
                    <AnimatePresence>
                      {appliedCoupon && discount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex justify-between text-emerald-600 overflow-hidden"
                        >
                          <span>Discount ({appliedCoupon.code})</span>
                          <span className="font-semibold">− {formatPrice(discount)}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mb-8 border-t border-[#e3dadd] pt-6">
                    <div className="flex items-end justify-between">
                      <span className="font-medium text-[#3f393e]">Total</span>
                      <span className="font-serif text-3xl text-[#186049]">
                        {formatPrice(total)}
                      </span>
                    </div>
                    <p className="mt-2 text-right text-[10px] uppercase tracking-widest text-[#9a9298]">
                      Including all taxes
                    </p>
                  </div>

                  <Link
                    to="/checkout"
                    state={{ appliedCoupon, discount }}
                    className="flex h-14 w-full items-center justify-center bg-[#242024] text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Cart;
