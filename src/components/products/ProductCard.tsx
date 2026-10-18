import { Link } from 'react-router-dom';
import { ShoppingBag, Star } from 'lucide-react';
import { useCartStore, type Product } from '@/stores/cartStore';
import { formatPrice } from '@/lib/currency';
import { optimizeImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useFlatDiscount } from '@/hooks/useFlatDiscount';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const { applyDiscount } = useFlatDiscount();

  const { displayPrice, originalPrice, flatBadge } = applyDiscount(product.price, product.originalPrice);

  // Prefer per-product badge over flat discount badge
  const badgeLabel = product.discountPercentage ? `-${product.discountPercentage}%` : flatBadge ? `-${flatBadge}` : null;
  const shownOriginal = originalPrice;

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <article className="group relative min-w-0">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[0.9] overflow-hidden bg-[#eee9eb]">
          {badgeLabel && (
            <span className="absolute left-2 top-2 z-10 bg-[#186049] px-2 py-1 text-[9px] font-semibold text-white">
              {badgeLabel}
            </span>
          )}
          <img
            src={optimizeImageUrl(product.imageUrl, 600, 75)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="pt-1">
          <div className="flex items-start justify-between gap-1">
            <h3 className="line-clamp-1 text-[11px] font-medium leading-4 text-[#3f393e]">{product.name}</h3>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0}
              aria-label={product.stockQuantity > 0 ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
              className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#eef6f2] text-[#242024] transition-colors hover:bg-[#186049] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-xs font-semibold text-[#c0394f]">{formatPrice(displayPrice)}</span>
              {shownOriginal && shownOriginal !== displayPrice ? (
                <span className="text-[9px] text-[#9a9298] line-through">{formatPrice(shownOriginal)}</span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1 text-[9px] text-[#9a9298]" aria-label={`${product.rating.toFixed(1)} out of 5 stars, ${product.reviewCount} reviews`}>
              <Star className="h-2.5 w-2.5 fill-[#d69a3a] text-[#d69a3a]" />
              <span className="font-medium text-[#6f666c]">{product.rating.toFixed(1)}</span>
              <span>({product.reviewCount})</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
