import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import FloatingNav from "@/components/layout/FloatingNav";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from 'react';
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
// @ts-ignore
import { PrismBackground } from "@/components/ui/react-bits";
import { CustomerChatWidget } from "@/components/chat/CustomerChatWidget";

const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
};

const PublicChatWidget = () => {
  const { pathname } = useLocation();
  return pathname.startsWith('/admin') ? null : <CustomerChatWidget />;
};

const PublicMobileNavigation = () => {
  const { pathname } = useLocation();
  return pathname.startsWith('/admin') ? null : <MobileBottomNav />;
};

const queryClient = new QueryClient();

const App = () => (
  <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_bW9ja2VkLWtleS0wMDAw'}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <ScrollToTop />
            <PublicChatWidget />
            <FloatingNav />
            <PublicMobileNavigation />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:orderId" element={<OrderDetails />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account/*" element={<Account />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/register" element={<Navigate to="/auth" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
