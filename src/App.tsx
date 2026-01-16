import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ProductDetails from "./pages/ProductDetails";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Account from "./pages/Account";
import AccountSettings from "./pages/AccountSettings";
import BecomeMerchant from "./pages/BecomeMerchant";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import TrackOrder from "./pages/TrackOrder";
import Install from "./pages/Install";
import Invoice from "./pages/Invoice";
import Favorites from "./pages/Favorites";
import CategoryProducts from "./pages/CategoryProducts";
import MyAddresses from "./pages/MyAddresses";
import MyNotifications from "./pages/MyNotifications";
import Offline from "./pages/Offline";
import NotFound from "./pages/NotFound";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineDetector } from "@/components/pwa/OfflineDetector";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OfflineDetector />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:id" element={<CategoryProducts />} />
              <Route path="/account" element={<Account />} />
              <Route path="/account/settings" element={<AccountSettings />} />
              <Route path="/account/addresses" element={<MyAddresses />} />
              <Route path="/account/notifications" element={<MyNotifications />} />
              <Route path="/become-merchant" element={<BecomeMerchant />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/merchant" element={<MerchantDashboard />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route path="/track/:orderId" element={<TrackOrder />} />
              <Route path="/install" element={<Install />} />
              <Route path="/invoice/:id" element={<Invoice />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/offline" element={<Offline />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <InstallPrompt />
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
