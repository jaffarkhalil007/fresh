import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import {
  Star,
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowLeft,
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

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading: productLoading } = useProduct(id);
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const [activeImage, setActiveImage] = useState(0);
  const galleryImages = product?.images?.length ? product.images : [product?.imageUrl ?? ''];
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const addItem = useCartStore((state) => state.addItem);
  const setBuyNowItem = useCartStore((state) => state.setBuyNowItem);
  const { applyDiscount } = useFlatDiscount();

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
        <div className="mx-auto max-w-[1280px] px-4 py-4 md:px-6 md:py-5">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#9a9298]">
            <Link to="/" className="transition-colors hover:text-[#186049]">
              Home
            </Link>
            <span>/</span>
            <Link
              to="/products"
              className="transition-colors hover:text-[#186049]"
            >
              Shop
            </Link>
            <span>/</span>
            <Link
              to={`/products?category=${product.category}`}
              className="transition-colors hover:text-[#186049]"
            >
              {product.category}
            </Link>
          </nav>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:gap-6">
            {" "}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="group relative flex aspect-[1.3] items-center justify-center overflow-hidden bg-[#fffdfc] p-0">
                {" "}
                <img
                  src={optimizeImageUrl(galleryImages[activeImage] ?? product.imageUrl, 600, 65)}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="relative z-10 h-[68%] w-[68%] object-contain mix-blend-multiply drop-shadow-2xl transition-transform duration-700 group-hover:scale-105 md:h-[72%] md:w-[72%]"
                />
                {/* Badges */}
                <div className="absolute left-5 top-5 z-20 flex flex-col gap-2">
                  {product.isExclusive && (
                    <span className="bg-[#242024] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                      Exclusive
                    </span>
                  )}
                </div>
              </div>
              {galleryImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {galleryImages.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`Show image ${index + 1}`}
                      className={`h-16 w-16 shrink-0 overflow-hidden border bg-[#fffdfc] p-1 transition-colors ${index === activeImage ? 'border-[#186049]' : 'border-[#e8e3e5] hover:border-[#186049]/50'}`}
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

              <h1 className="mb-2 max-w-xl font-serif text-3xl leading-none text-[#242024] md:text-5xl">
                {product.name}
              </h1>

              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(product.rating)
                          ? "fill-amber-500 text-amber-500"
                          : "fill-[#eee9eb] text-[#d8cfd3]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-[#3f393e]">
                  {product.rating}
                </span>
                <span className="text-xs text-[#9a9298]">
                  ({product.reviewCount} reviews)
                </span>
              </div>

              <div className="mb-4 flex items-end gap-3">
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
                      On orders above Rs.500
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
                Reviews ({product.reviewCount})
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

                  <h3 className="mb-3 font-serif text-2xl text-[#242024]">
                    Specifications
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex justify-between border-t border-[#e8e3e5] p-2.5">
                      <span className="text-xs text-[#9a9298]">
                        Weight/Quantity
                      </span>
                      <span className="text-xs font-medium text-[#3f393e]">
                        {product.unit}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[#e8e3e5] p-2.5">
                      <span className="text-xs text-[#9a9298]">Category</span>
                      <span className="text-xs font-medium capitalize text-[#3f393e]">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[#e8e3e5] p-2.5">
                      <span className="text-xs text-[#9a9298]">
                        Stock Available
                      </span>
                      <span className="text-xs font-medium text-[#3f393e]">
                        {product.stockQuantity} units
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ProductReviews productId={product.id} />
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









