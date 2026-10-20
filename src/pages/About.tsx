import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Tag, Layers, Truck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const features = [
  {
    icon: Tag,
    title: 'Wholesale Pricing',
    description:
      'Products are offered at reduced rates, ideal for resellers or customers looking for budget-friendly options without compromising on quality.',
  },
  {
    icon: Layers,
    title: 'Diverse Categories',
    description:
      'From fashion and beauty to home essentials, we provide a comprehensive selection of items — household, electronics, apparel, kitchenware, and more.',
  },
  {
    icon: Package,
    title: 'Bulk Purchase Options',
    description:
      'Buy in larger quantities to save more. Perfect for businesses, retailers, or events that require supplies in volume.',
  },
  {
    icon: Truck,
    title: 'Nationwide Delivery',
    description:
      'Fast and reliable delivery across Pakistan, making wholesale shopping accessible to everyone — wherever you are.',
  },
];

const stats = [
  { value: '10,000+', label: 'Products Listed' },
  { value: '50+', label: 'Categories' },
  { value: '100+', label: 'Cities Served' },
  { value: '24/7', label: 'Customer Support' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fffdfc] selection:bg-[#d9e7e3]">
      <Header />

      <main className="flex-1 pt-20 md:pt-28 lg:pt-36">

        {/* ── Hero ── */}
        <section className="border-b border-[#e8e3e5] pb-14 pt-10 md:pb-20 md:pt-16">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#186049]"
            >
              Our Story
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="max-w-3xl font-serif text-4xl leading-[1.08] text-[#242024] md:text-6xl"
            >
              Wholesale made <em className="text-[#186049]">simple</em> for every Pakistani.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-6 max-w-2xl text-sm leading-relaxed text-[#777077] md:text-base"
            >
              Hamaash is a platform that specialises in offering a wide range of products at
              wholesale rates, catering to both individual buyers and businesses. By providing
              competitive prices and bulk purchasing options, we aim to make wholesale shopping
              convenient and affordable for customers across Pakistan.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.26 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/products"
                className="inline-flex items-center bg-[#186049] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f3d2c] hover:shadow-md"
              >
                Shop Now
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center border border-[#242024] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#242024] transition-all hover:-translate-y-0.5 hover:border-[#186049] hover:text-[#186049]"
              >
                Contact Us
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        {/* <section className="bg-[#242024] py-10">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="text-center"
                >
                  <div className="font-serif text-3xl text-[#d9e7e3] md:text-4xl">{stat.value}</div>
                  <div className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-white/50">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section> */}

        {/* ── Mission ── */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="grid gap-10 md:grid-cols-2 md:gap-16 lg:items-center">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#186049]">
                  Our Mission
                </p>
                <h2 className="font-serif text-3xl leading-tight text-[#242024] md:text-4xl">
                  Bringing the wholesale market to your doorstep.
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-[#777077]">
                  We believe everyone deserves access to fair prices — not just large businesses.
                  Hamaash bridges the gap between manufacturers and end consumers by eliminating
                  unnecessary middlemen and passing the savings directly to you.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[#777077]">
                  Whether you're stocking a store, preparing for a family event, or simply buying
                  smarter for your household, Hamaash is built for you.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { label: 'Founded', value: '2026' },
                  { label: 'Based in', value: 'Pakistan' },
                  { label: 'Focus', value: 'Wholesale' },
                  { label: 'Delivery', value: 'Nationwide' },
                ].map((item) => (
                  <div key={item.label} className="bg-[#f4f0ed] p-5">
                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#9a9298]">
                      {item.label}
                    </div>
                    <div className="font-serif text-xl text-[#242024]">{item.value}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Key Features ── */}
        <section className="bg-[#f4f0ed] py-16 md:py-24">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#186049]">
                Why Hamaash
              </p>
              <h2 className="font-serif text-3xl text-[#242024] md:text-4xl">
                Everything you need, at the right price.
              </h2>
            </motion.div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="group bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center bg-[#e3f0ea]">
                    <feature.icon className="h-5 w-5 text-[#186049]" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg text-[#242024]">{feature.title}</h3>
                  <p className="text-[13px] leading-relaxed text-[#777077]">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-[#e8e3e5] py-16 md:py-24">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-serif text-3xl text-[#242024] md:text-4xl">
                Ready to shop smarter?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#777077]">
                Join thousands of customers across Pakistan who trust Hamaash for quality
                products at unbeatable wholesale prices.
              </p>
              <Link
                to="/products"
                className="mt-8 inline-flex items-center bg-[#242024] px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#186049] hover:shadow-md"
              >
                Browse All Products
              </Link>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default About;
