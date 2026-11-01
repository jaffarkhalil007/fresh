import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Product } from '@/stores/cartStore';
import type { Banner } from '@/hooks/useBanners';

interface HeroSectionProps {
  products: Product[];
  banners?: Banner[];
}

interface Slide {
  key: string;
  image: string;
  kicker: string;
  title: string;
  caption: string;
  href: string;
}

const isExternal = (href: string) => /^https?:\/\//i.test(href);

const HeroSection = ({ products, banners = [] }: HeroSectionProps) => {
  // Admin-uploaded banners take priority. Until any exist, fall back to product images.
  const editorialProducts = products.filter((product) => product.imageUrl).slice(0, 3);
  const slides: Slide[] = banners.length > 0
    ? banners.map((banner) => ({
        key: banner.id,
        image: banner.image_url,
        kicker: banner.subtitle || '',
        title: banner.title || '',
        caption: '',
        href: banner.link_url || '/products',
      }))
    : editorialProducts.map((product, index) => ({
        key: product.id,
        image: product.imageUrl,
        kicker: index === 0 ? 'Trend alert' : index === 1 ? 'The edit' : 'Just dropped',
        title: product.category,
        caption: product.name,
        href: `/product/${product.id}`,
      }));

  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (slides.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  // Keep the index valid when the slide list changes (e.g. banners load or are removed).
  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const activeSlide = slides[safeIndex];
  const showNext = () => setActiveIndex((safeIndex + 1) % slides.length);
  const showPrevious = () => setActiveIndex((safeIndex - 1 + slides.length) % slides.length);

  const slideContent = (slide: Slide) => (
    <>
      <img src={slide.image} alt={slide.title || slide.caption || 'Banner'} className="h-full w-full object-fill" />
      {(slide.title || slide.kicker) && <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />}
      <div className="absolute inset-x-0 bottom-0 p-6 pt-24 text-white md:p-10 md:pt-32">
        {slide.kicker && <p className="text-[9px] uppercase tracking-[0.18em] text-white/70">{slide.kicker}</p>}
        {slide.title && <h2 className="mt-1 font-serif text-3xl md:text-5xl">{slide.title}</h2>}
        {slide.caption && <p className="mt-1 text-xs text-white/75 md:text-sm">{slide.caption}</p>}
      </div>
    </>
  );

  return (
    <section className="hero-editorial pt-[52px] md:pt-24 lg:pt-32">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* <div className="flex min-h-[340px] flex-col justify-center bg-[#d8c5ee] p-7 md:min-h-[430px] md:p-10">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#72577e]">✣ Vertexo trends</p>
          <h1 className="max-w-[260px] font-serif text-5xl leading-[0.92] text-[#201b22] md:text-6xl">New energy.<br /><em>New you.</em></h1>
          <p className="mt-5 max-w-[220px] text-xs leading-relaxed text-[#584c60]">Curated looks for every version of you.</p>
          <Link to="/products" className="mt-7 inline-flex w-fit bg-[#252126] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-white transition-transform hover:-translate-y-0.5">Shop the edit <span className="ml-3">→</span></Link>
        </div> */}
        {activeSlide ? (
          <div
            className="relative h-[22vh] min-h-[160px] w-full overflow-hidden bg-[#d9e7e3] md:h-[36vh] md:min-h-[300px]"
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const diff = touchStartX - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40) diff > 0 ? showNext() : showPrevious();
              setTouchStartX(null);
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                {isExternal(activeSlide.href) ? (
                  <a href={activeSlide.href} target="_blank" rel="noopener noreferrer" className="group block h-full">
                    {slideContent(activeSlide)}
                  </a>
                ) : (
                  <Link to={activeSlide.href} className="group block h-full">
                    {slideContent(activeSlide)}
                  </Link>
                )}
              </motion.div>
            </AnimatePresence>

            {slides.length > 1 && (
              <>
                {/* Arrows — desktop only, smaller + transparent */}
                <button type="button" onClick={showPrevious} aria-label="Previous banner" className="absolute left-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-sm transition-all hover:bg-white/50 md:flex md:left-6"><ArrowLeft className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={showNext} aria-label="Next banner" className="absolute right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-sm transition-all hover:bg-white/50 md:flex md:right-6"><ArrowRight className="h-3.5 w-3.5" /></button>

                {/* Plain dots */}
                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 md:bottom-5">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.key}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Show banner ${index + 1}`}
                      className={`rounded-full transition-all duration-300 ${index === safeIndex ? 'w-4 h-1.5 bg-white' : 'h-1.5 w-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex h-[38vh] min-h-[260px] items-center justify-center bg-[#b9d6d4] p-8 text-center md:h-[50vh] md:min-h-[420px]"><p className="font-serif text-3xl text-[#214341]">Your next everyday edit starts here.</p></div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
