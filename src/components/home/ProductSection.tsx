import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/stores/cartStore';
import { motion } from 'framer-motion';

interface ProductSectionProps {
  title?: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
  badge?: string;
  badgeColor?: string;
  scrollDirection?: 'horizontal' | 'vertical';
  bgColor?: string;
}

const ProductSection = ({
  title,
  subtitle,
  products,
  viewAllLink,
  badge,
  scrollDirection = 'horizontal',
  bgColor = 'bg-[#f4f0ed]',
}: ProductSectionProps) => {
  return (
    <section className={`relative z-10 ${bgColor} py-4 md:py-6`}>
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        {/* Header — omitted when no title is provided */}
        {(title || viewAllLink) && <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            {badge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#186049]"
              >
                {badge}
              </motion.div>
            )}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-serif text-2xl leading-tight text-[#242024] sm:text-3xl md:text-4xl"
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-xs sm:text-sm text-[#777077]"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          
          {viewAllLink && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="shrink-0"
            >
              <Link 
                to={viewAllLink}
                className="group inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f595d] transition-colors hover:text-[#186049]"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </div>}

        {/* Products list: vertical grid or horizontal scroll */}
        {scrollDirection === 'vertical' ? (
          <div className="-mx-4 grid grid-cols-2 gap-x-2 gap-y-4 px-2 md:mx-0 md:gap-x-3 md:gap-y-6 md:px-0 md:grid-cols-4 xl:grid-cols-5 lg:gap-x-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: (index % 6) * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          /* Break out of the max-w container so cards can peek at the right edge */
          <div className="-mx-4 md:-mx-8 overflow-x-auto scrollbar-none scroll-smooth">
            <div className="flex gap-2 px-2 pb-4 md:gap-4 md:px-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: index * 0.04 }}
                  /* vw-based widths: show N complete cards with ~40px partial of the next */
                  className="w-[40vw] min-w-[40vw] shrink-0
                             sm:w-[30vw] sm:min-w-[30vw]
                             md:w-[27vw] md:min-w-[27vw]
                             lg:w-[22vw] lg:min-w-[22vw]
                             xl:w-[18vw] xl:min-w-[18vw]
                             max-w-[280px]"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
              {/* Right-edge spacer so last card isn't flush against the edge */}
              <div className="shrink-0 w-4 md:w-8" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
