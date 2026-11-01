import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import ProductReviews from "@/components/products/ProductReviews";

import { useProducts, useProduct } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import { optimizeImageUrl } from "@/lib/utils";
import { useFlatDiscount } from "@/hooks/useFlatDiscount";
import { useDeliverySettings } from "@/hooks/useDeliverySettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading: productLoading } = useProduct(id);
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const [activeImage, setActiveImage] = useState(0);
  const galleryImages = product?.images?.length ? product.images : [product?.imageUrl ?? ''];
  const showPrevImage = () => setActiveImage(i => (i - 1 + galleryImages.length) % galleryImages.length);
  const showNextImage = () => setActiveImage(i => (i + 1) % galleryImages.length);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  // Fetch review stats on page load — independent of tab state
  const { data: reviewStats } = useQuery({
    queryKey: ['review-stats', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', id);
      const count = data?.length ?? 0;
      const avg = count > 0 ? data!.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / count : null;
      return { count, averageRating: avg };
    },
    enabled: !!id,
  });

  // Live stats updated when the Reviews tab is open (more granular, same source of truth)
  const [liveReviewCount, setLiveReviewCount] = useState<number | null>(null);
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const handleReviewCountChange = useCallback((count: number) => {
    setLiveReviewCount(count);
  }, []);
  const handleStatsChange = useCallback(({ count, averageRating }: { count: number; averageRating: number }) => {
    setLiveReviewCount(count);
    if (count > 0) setLiveRating(averageRating);
  }, []);

  // Resolve which values to display: live tab data > page-load query > DB field
  const displayReviewCount = liveReviewCount ?? reviewStats?.count ?? product?.reviewCount ?? 0;
  const displayRating = liveRating ?? reviewStats?.averageRating ?? product?.rating ?? 4.5;

  const addItem = useCartStore((state) => state.addItem);
  const setBuyNowItem = useCartStore((state) => state.setBuyNowItem);
  const { applyDiscount } = useFlatDiscount();
  const { data: deliverySettings } = useDeliverySettings();
  const FREE_DELIVERY_MIN = deliverySettings?.free_delivery_minimum ?? 1000;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (productLoading || productsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-24 text-center">
          <h1 className="text-3xl font-display text-foreground mb-6">
            Product Not Found
          </h1>
          <Link
            to="/products"
            className="inline-flex items-center bg-[#242024] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gallery
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.name} added to cart`, {
      className:
        "glass !bg-background/80 !border-emerald-500/30 !text-foreground",
    });
  };

  const handleBuyNow = () => {
    setBuyNowItem(product, quantity);
    navigate("/checkout");
  };

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const { displayPrice, originalPrice: flatOriginal, flatBadge } = applyDiscount(product.price, product.originalPrice);
  const shownOriginal = flatOriginal;
  const saleBadge = product.discountPercentage ? `-${product.discountPercentage}%` : flatBadge ? `-${flatBadge}` : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#fffdfc] selection:bg-[#d9e7e3]">
      <Header />

      <main className="flex-1 pt-16 md:pt-24">
        <div className="mx-auto max-w-[1280px] px-4 py-3 md:px-6 md:py-5">
          {/* Breadcrumb — desktop only */}
          <nav className="mb-4 hidden items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a9298] md:flex">
            <Link to="/" className="transition-colors hover:text-[#186049]">Home</Link>
            <span>/</span>
            <Link to="/products" className="transition-colors hover:text-[#186049]">Shop</Link>
            <span>/</span>
            <Link to={`/products?category=${product.category}`} className="transition-colors hover:text-[#186049]">
              {product.category}
            </Link>
          </nav>

          <div className="grid gap-3 md:gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
            {/* ── Image Carousel ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Main image */}
              <div className="relative aspect-square w-full overflow-hidden bg-[#f4f0ed] md:aspect-[4/3]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={optimizeImageUrl(galleryImages[activeImage] ?? product.imageUrl, 800, 75)}
                    alt={product.name}
                    loading="eager"
                    decoding="async"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full object-contain p-6 mix-blend-multiply md:p-8"
                  />
                </AnimatePresence>

                {/* Prev / Next arrows */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevImage}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft className="h-4 w-4 text-[#3f393e]" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform hover:scale-105 active:scale-95"
                    >
                      <ChevronRight className="h-4 w-4 text-[#3f393e]" />
                    </button>
                  </>
                )}

                {/* Exclusive badge */}
                {product.isExclusive && (
                  <span className="absolute left-4 top-4 z-20 bg-[#242024] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                    Exclusive
                  </span>
                )}

                {/* Dot indicators — mobile */}
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 md:hidden">
                    {galleryImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        aria-label={`Image ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${i === activeImage ? 'w-4 bg-[#186049]' : 'w-1.5 bg-[#d8cfd3]'}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail strip — md+ */}
              {galleryImages.length > 1 && (
                <div className="mt-3 hidden gap-2 overflow-x-auto md:flex">
                  {galleryImages.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`Show image ${index + 1}`}
                      className={`h-16 w-16 shrink-0 overflow-hidden border bg-[#f4f0ed] p-1 transition-all ${index === activeImage ? 'border-[#186049]' : 'border-[#e8e3e5] hover:border-[#186049]/50'}`}
                    >
                      <img src={optimizeImageUrl(url, 160, 60)} alt="" loading="lazy" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col justify-center py-0 lg:py-2"
            >
              {/* <div className="mb-2 inline-flex self-start bg-[#f4f0ed] px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[#186049]">
                {product.category}
              </div> */}

              <h1 className="mb-2 max-w-xl font-serif text-xl leading-tight text-[#242024] md:text-3xl">
                {product.name}
              </h1>

              <div className="mb-3 flex items-center gap-2">
                <>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const filled = n <= Math.floor(displayRating);
                      const half = !filled && n === Math.ceil(displayRating) && displayRating % 1 >= 0.3;
                      return (
                        <span key={n} className="relative inline-block">
                          <Star className="h-3.5 w-3.5 fill-[#e5e7eb] text-[#e5e7eb]" />
                          {(filled || half) && (
                            <span className="absolute inset-0 overflow-hidden" style={{ width: half ? '50%' : '100%' }}>
                              <Star className="h-3.5 w-3.5 fill-[#f97316] text-[#f97316]" />
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-xs font-medium text-[#3f393e]">{displayRating.toFixed(1)}</span>
                  <span className="text-xs text-[#9a9298]">
                    ({displayReviewCount} {displayReviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              </div>

              <div className="mb-2 flex items-end gap-3">
                {saleBadge && (
                  <span className="self-center bg-[#186049] px-2 py-1 text-[9px] font-semibold text-white">
                    {saleBadge}
                  </span>
                )}
                <span className="text-2xl font-semibold text-[#186049] md:text-3xl">
                  {formatPrice(displayPrice)}
                </span>
                {shownOriginal && shownOriginal !== displayPrice && (
                  <span className="mb-0.5 text-sm text-[#9a9298] line-through">
                    {formatPrice(shownOriginal)}
                  </span>
                )}
              </div>

              {/* Unit & Stock — small info row below price */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs text-[#9a9298]">
                  Unit: <span className="font-medium text-[#5f595d]">{product.unit}</span>
                </span>
                <span className="text-[#e3dadd]">·</span>
                <span className="text-xs text-[#9a9298]">
                  Stock:{" "}
                  {product.stockQuantity > 0 ? (
                    <span className="font-medium text-[#5f595d]">{product.stockQuantity} available</span>
                  ) : (
                    <span className="font-medium text-rose-500">Out of stock</span>
                  )}
                </span>
              </div>

              <div className="mb-4 bg-[#f4f0ed] p-3 md:p-4">
                <div className="mb-3 flex items-center justify-between border-b border-[#e3dadd] pb-3">
                  <span className="text-xs text-[#777077]">Quantity</span>
                  <div className="flex h-8 w-24 items-center justify-between border border-[#d8cfd3] bg-white px-1">
                    <button
                      className="flex h-6 w-6 items-center justify-center text-[#3f393e] transition-colors hover:bg-[#eee9eb]"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-medium text-[#3f393e]">
                      {quantity}
                    </span>
                    <button
                      className="flex h-6 w-6 items-center justify-center text-[#3f393e] transition-colors hover:bg-[#eee9eb]"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex h-9 w-full items-center justify-center gap-1.5 bg-[#186049] text-[9px] font-semibold uppercase tracking-[0.08em] text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleBuyNow}
                    disabled={product.stockQuantity === 0}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Buy Now
                  </button>
                  <button
                    className="flex h-9 w-full items-center justify-center gap-1.5 bg-[#242024] text-[9px] font-semibold uppercase tracking-[0.08em] text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleAddToCart}
                    disabled={product.stockQuantity === 0}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 border-t border-[#e8e3e5] pt-2.5">
                  <Truck className="h-4 w-4 text-[#186049]" />
                  <div>
                    <div className="mb-0.5 text-[10px] font-bold text-[#3f393e]">
                      Free Delivery
                    </div>
                    <div className="text-[9px] text-[#9a9298]">
                      On orders above Rs.{FREE_DELIVERY_MIN.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-[#e8e3e5] pt-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#186049]" />
                  <div>
                    <div className="mb-0.5 text-[10px] font-bold text-[#3f393e]">
                      Secure Checkout
                    </div>
                    <div className="text-[9px] text-[#9a9298]">
                      100% Protected
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="mx-auto mb-16 mt-12 max-w-4xl">
            <div className="mb-4 flex border-b border-[#e8e3e5]">
              <button
                className={`relative px-4 pb-2.5 text-xs font-medium transition-colors ${
                  activeTab === "description"
                    ? "text-[#186049]"
                    : "text-[#9a9298] hover:text-[#3f393e]"
                }`}
                onClick={() => setActiveTab("description")}
              >
                Description
                {activeTab === "description" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#186049]"
                  />
                )}
              </button>
              <button
                className={`relative px-4 pb-2.5 text-xs font-medium transition-colors ${
                  activeTab === "reviews"
                    ? "text-[#186049]"
                    : "text-[#9a9298] hover:text-[#3f393e]"
                }`}
                onClick={() => setActiveTab("reviews")}
              >
                Reviews ({displayReviewCount})
                {activeTab === "reviews" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#186049]"
                  />
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "description" ? (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="leading-relaxed text-[#5f595d]"
                >
                  <p className="mb-4 text-xs leading-5">{product.description}</p>

                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <>
                      <h3 className="mb-3 font-serif text-2xl text-[#242024]">
                        Specifications
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between border-t border-[#e8e3e5] p-2.5">
                            <span className="text-xs text-[#9a9298]">{key}</span>
                            <span className="text-xs font-medium text-[#3f393e]">{value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-[#e8e3e5] bg-white px-6 py-5"
                >
                  <ProductReviews productId={product.id} onCountChange={handleReviewCountChange} onStatsChange={handleStatsChange} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="border-t border-[#e8e3e5] pt-12">
              <h2 className="mb-6 text-center font-serif text-3xl text-[#242024]">
                More from this collection
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;









