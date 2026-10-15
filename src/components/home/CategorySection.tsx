import { Link } from "react-router-dom";
import type { Product } from "@/stores/cartStore";
import { useCategories } from "@/hooks/useCategories";

interface CategorySectionProps {
  products: Product[];
}

const CategorySection = ({ products }: CategorySectionProps) => {
  const { data: dbCategories = [] } = useCategories();

  // Use DB categories if available (with image), else fall back to per-product images
  const hasDbCategories = dbCategories.length > 0;

  // Fallback: derive from products (original behaviour)
  const productMoods = Array.from(
    new Map(
      products
        .filter((product) => product.imageUrl)
        .map((product) => [product.category, product]),
    ).values(),
  ).slice(0, 8);

  return (
    <section className="bg-[#fffdfc] py-2 md:py-4">
      <div className="mx-auto max-w-[1440px] px-2 md:px-4">
        <div className="mt-2 flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl text-[#242024] md:text-4xl">
            Find your <em className="text-[#a35d70]">everyday</em>
          </h2>
          <Link
            to="/products"
            className="hidden text-[10px] uppercase tracking-[0.12em] text-[#5f595d] md:block"
          >
            View all →
          </Link>
        </div>

        {hasDbCategories ? (
          // ── DB-powered categories ──
          <div className="mt-8 flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
            {dbCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="group min-w-[74px] text-center md:min-w-[112px]"
              >
                <div className="mx-auto aspect-square w-[74px] overflow-hidden rounded-full bg-[#eee9eb] md:w-[112px]">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      🏷️
                    </div>
                  )}
                </div>
                <span className="mt-3 block text-[10px] capitalize text-[#484147]">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        ) : productMoods.length > 0 ? (
          // ── Fallback: product-image categories ──
          <div className="mt-8 flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
            {productMoods.map((product) => (
              <Link
                key={product.category}
                to={`/products?category=${encodeURIComponent(product.category)}`}
                className="group min-w-[74px] text-center md:min-w-[112px]"
              >
                <div className="mx-auto aspect-square w-[74px] overflow-hidden rounded-full bg-[#eee9eb] md:w-[112px]">
                  <img
                    src={product.imageUrl}
                    alt={product.category}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <span className="mt-3 block text-[10px] capitalize text-[#484147]">
                  {product.category}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-[#777077]">
            New collections are arriving soon.
          </p>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
