import { Link } from "react-router-dom";
import { Instagram, Youtube, Circle } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { FaFacebookF, FaYoutube } from "react-icons/fa";
const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-[#e8e3e5] bg-[#fffdfc] pb-8 pt-16 text-[#4e484d]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-[#e8e3e5] pb-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          <div className="space-y-5">
            <Link
              to="/"
              className="inline-block font-serif text-2xl tracking-[0.08em] text-[#242024]"
            >
              HAMAASH
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-[#777077]">
              Style that moves with you. Designed for the everyday
              extraordinary.
            </p>
            <div className="flex items-center gap-4 text-[#242024]">
              <a href="#instagram" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#tiktok" aria-label="TikTok">
                <SiTiktok className="h-4 w-4" />
              </a>
              <a href="#facebook" aria-label="Facebook">
                <FaFacebookF className="h-4 w-4" />
              </a>

              
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#242024]">
              Customer care
            </h4>
            <ul className="space-y-3 text-sm text-[#777077]">
              <li>
                <Link
                  to="/faq"
                  className="hover:text-[#186049] transition-colors"
                >
                  Help center
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="hover:text-[#186049] transition-colors"
                >
                  Track my order
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-[#186049] transition-colors"
                >
                  Returns & refunds
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-[#186049] transition-colors"
                >
                  Delivery information
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#242024]">
              About Hamaash
            </h4>
            <ul className="space-y-3 text-sm text-[#777077]">
              <li>
                <Link to="/" className="hover:text-[#186049] transition-colors">
                  Our story
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-[#186049] transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#186049] transition-colors">
                  Our impact
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#186049] transition-colors">
                  The journal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#242024]">
              Get the good stuff
            </h4>
            <p className="mb-4 text-sm text-[#777077]">
              New drops, styling notes, and 10% off your first order.
            </p>
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                type="email"
                placeholder="Your email address"
                aria-label="Your email address"
                className="h-11 w-full border-b border-[#bdb5ba] bg-transparent px-0 text-sm text-[#242024] outline-none placeholder:text-[#9a9298] focus:border-[#186049]"
              />
              <button
                type="submit"
                className="self-end text-[10px] uppercase tracking-[0.12em] text-[#186049]"
              >
                Sign up
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-[10px] text-[#9a9298] md:flex-row">
          <p>© {new Date().getFullYear()} Hamaash. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="hover:text-[#242024] transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="hover:text-[#242024] transition-colors"
            >
              Terms
            </Link>
            <a
              href="#cookies"
              className="hover:text-[#242024] transition-colors"
            >
              Cookie settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
