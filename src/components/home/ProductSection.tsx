import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { Product } from '@/stores/cartStore';
import { motion } from 'framer-motion';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
  badge?: string;
  badgeColor?: string;
  scrollDirection?: 'horizontal' | 'vertical';
}

const ProductSection = ({
  title,
  subtitle,
  products,
  viewAllLink,
  badge,
  scrollDirection = 'horizontal',
}: ProductSectionProps) => {
  return (
    <section className="relative z-10 bg-[#f4f0ed] py-4 md:py-6">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
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
        </div>

        {/* Products list: vertical grid or horizontal scroll */}
        {scrollDirection === 'vertical' ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 xl:grid-cols-5 lg:gap-x-4">
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
          <div className="flex overflow-x-auto gap-3.5 sm:gap-4 pb-4 pt-1 scrollbar-none scroll-smooth">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.04 }}
                className="w-[165px] min-w-[165px] sm:w-[200px] sm:min-w-[200px] md:w-[240px] md:min-w-[240px] shrink-0"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
