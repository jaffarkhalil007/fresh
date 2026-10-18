import { useMemo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import CategorySection from '@/components/home/CategorySection';
import ProductSection from '@/components/home/ProductSection';
import PromoBanner from '@/components/home/PromoBanner';
import { useProducts } from '@/hooks/useProducts';
import { useBanners } from '@/hooks/useBanners';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: banners = [] } = useBanners();

  const topSelling = products.filter((product) => product.isTopSelling);
  const exclusive = products.filter((product) => product.isExclusive);
  const promotional = products.filter((product) => product.isPromotional);
  const trending = topSelling.length > 0 ? topSelling : products;

  const randomProducts = useMemo(() => {
    return [...products].sort(() => 0.5 - Math.random());
  }, [products]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection products={products} banners={banners} />

        <CategorySection products={products} />
        
        <ProductSection
          title="Trending right now"
          products={trending.slice(0, 10)}
          viewAllLink={topSelling.length > 0 ? '/products?filter=top-selling' : '/products'}
          scrollDirection="horizontal"
        />

        {randomProducts.length > 0 && (
          <ProductSection
            title="Discover More"
            products={randomProducts}
            viewAllLink="/products"
            scrollDirection="vertical"
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
