import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '@/stores/cartStore';

interface PromoBannerProps {
  products: Product[];
}

const PromoBanner = ({ products }: PromoBannerProps) => {
  const images = products.filter((product) => product.imageUrl).slice(0, 2);
  const banners = [
    { title: 'Layers worth living in', link: '/products?filter=promotional', label: 'New season' },
    { title: 'Finish the look', link: '/products', label: 'The accessories edit' },
  ];

  return (
    <section className="bg-[#fffdfc] py-8 md:py-12">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-5 flex items-end justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#186049]">Only at Hamaash </p><h2 className="mt-1 font-serif text-3xl text-[#242024]">Fresh picks, <em className="text-[#186049]">better prices</em></h2></div>
          <Link to="/products?filter=promotional" className="text-[10px] uppercase tracking-[0.12em] text-[#5f595d]">Shop sale →</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {banners.map((banner, index) => (
            <Link key={banner.title} to={banner.link} className="group relative min-h-[230px] overflow-hidden bg-[#d9e7e3] md:min-h-[300px]">
              {images[index] && <img src={images[index].imageUrl} alt={banner.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-6 text-white md:p-8"><p className="text-[9px] uppercase tracking-[0.18em] text-white/70">{banner.label}</p><h3 className="mt-1 max-w-[260px] font-serif text-3xl">{banner.title}</h3><span className="mt-4 inline-flex items-center text-[10px] uppercase tracking-[0.12em]">Shop now <ArrowRight className="ml-2 h-3 w-3" /></span></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
