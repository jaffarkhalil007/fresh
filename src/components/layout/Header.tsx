import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Sun, Moon, Gift, CircleHelp, Package, MessageCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cartStore';
import SearchAutocomplete from '@/components/search/SearchAutocomplete';
import { categories } from '@/data/products';
import { useFlatDiscount } from '@/hooks/useFlatDiscount';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const cartItemsCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const { scrollY } = useScroll();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const { discount } = useFlatDiscount();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  return (
    <>
      <div className="fixed top-0 z-50 w-full">
        <div className="hidden lg:block h-8 bg-[#211e21] px-4 text-[10px] tracking-[0.08em] text-white/80">
          <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between">
            <span>
              {discount.enabled && discount.percentage > 0
                ? (discount.banner_text || `🎉 Flat ${discount.percentage}% OFF on all products today!`)
                : 'Free standard shipping on orders over ₨4,000'}
            </span>
            <div className="flex items-center gap-5">
              <a href="#track" className="hover:text-white transition-colors">Track order</a>
              <a href="#rewards" className="hover:text-white transition-colors">HAMAASH rewards</a>
              <a href="#help" className="hover:text-white transition-colors">Help center</a>
            </div>
          </div>
        </div>
        <header
          className={`bg-white/95 transition-all duration-300 ${isScrolled
              ? 'backdrop-blur-xl border-b border-[#e8e3e5] py-1.5 md:py-2'
              : 'border-b border-[#eee9eb] py-2.5 md:py-3'
            }`}
        >
          <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-4 md:px-8">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            {/* Logo */}
            <Link to="/" className="shrink-0 font-serif text-[24px] tracking-[0.08em] text-[#242024] md:text-[26px]">
              HAMAASH
            </Link>

            {/* Search (Desktop) */}
            <div className="hidden flex-1 md:block md:max-w-md md:mx-auto">
              <SearchAutocomplete className="w-full" />
            </div>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-1 md:flex">
              {/* <button onClick={toggleTheme} className="header-icon" aria-label="Toggle theme">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button> */}
              {/* <Link to="/products" className="header-icon" aria-label="Search products">
                <Search className="h-5 w-5 " />
              </Link> */}
              <Link to="/contact" className="header-icon" aria-label="Contact us">
                <Phone className="h-5 w-5" />
              </Link>
              <Link to={user ? '/cart' : '/auth'} className="header-icon relative" aria-label="Shopping bag">
                <ShoppingCart className="h-5 w-5" />
                <AnimatePresence>
                  {cartItemsCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#186049] text-[9px] font-bold text-white"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
              <Link to={user ? '/account' : '/auth'} className="header-icon" aria-label={user ? 'Account' : 'Sign in'}>
                <User className="h-5 w-5" />
              </Link>
              
            </div>

            {/* Mobile Menu Toggle */}
            <div className="ml-auto flex items-center gap-2 md:hidden">
              <Link to={user ? '/cart' : '/auth'} className="header-icon relative" aria-label="Shopping bag">
                <ShoppingCart className="h-5 w-5" />
                <AnimatePresence>
                  {cartItemsCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#186049] text-[9px] font-bold text-white"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
          </div>
          <nav className="mx-auto mt-2 hidden max-w-[1440px] items-center justify-center gap-8 border-t border-[#eee9eb] pt-2 md:flex">
            {[{ label: 'New In', path: '/products' }, ...categories.slice(0, 7).map((category) => ({ label: category.name.split(' ')[0], path: `/products?category=${category.id}` }))].map((item) => (
              <Link key={item.label} to={item.path} className="text-[11px] uppercase tracking-[0.12em] text-[#5f595d] transition-colors hover:text-[#186049]">{item.label}</Link>
            ))}
            <Link to="/products?filter=promotional" className="text-[11px] uppercase tracking-[0.12em] text-[#186049]">Sale</Link>
          </nav>
        </header>
      </div>

      {/* Mobile Menu Sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 top-0 flex w-4/5 max-w-sm flex-col border-r border-[#e8e3e5] bg-[#fffdfd] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-serif text-xl tracking-[0.08em]">HAMAASH</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="header-icon"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { icon: Search, label: 'Search', path: '/products' },
                  { icon: Package, label: 'My Orders', path: user ? '/orders' : '/auth' },
                  { icon: User, label: user ? 'My Account' : 'Sign In', path: user ? '/account' : '/auth' },
                  { icon: Gift, label: 'Sale', path: '/products?filter=promotional' },
                  { icon: MessageCircle, label: 'Contact Us', path: '/contact' },
                  { icon: CircleHelp, label: 'Help center', path: '/faq' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 border-b border-[#eee9eb] py-4 transition-colors hover:text-[#186049]"
                    >
                      <item.icon className="h-5 w-5 text-[#186049]" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
