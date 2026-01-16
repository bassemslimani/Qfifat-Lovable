import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Trash2 } from "lucide-react";

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favoriteProductIds, toggleFavorite, isLoading: favLoading } = useFavorites();
  const { addItem } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["favorite-products", favoriteProductIds],
    queryFn: async () => {
      if (favoriteProductIds.length === 0) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .in("id", favoriteProductIds);

      if (error) throw error;
      return data;
    },
    enabled: favoriteProductIds.length > 0,
  });

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.original_price || undefined,
      image: product.image_url,
      category: product.categories?.name || "",
      inStock: product.in_stock,
      rating: product.rating,
      reviewCount: product.review_count,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-14">
        <Header />
        <div className="container py-12 pt-safe text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">قائمة المفضلة</h2>
          <p className="text-muted-foreground mb-6">يجب تسجيل الدخول لرؤية المفضلة</p>
          <Button onClick={() => navigate("/auth")} variant="hero">
            تسجيل الدخول
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 pb-20">
      <Header />
      
      <div className="container py-4 pt-safe">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowRight className="h-5 w-5" />
          <span>رجوع</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          المنتجات المفضلة
        </h1>

        {isLoading || favLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Heart className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">لا توجد منتجات مفضلة</h2>
            <p className="text-muted-foreground mb-6">
              ابدأ بإضافة المنتجات التي تعجبك للمفضلة
            </p>
            <Button onClick={() => navigate("/products")} variant="hero">
              تصفح المنتجات
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl shadow-card overflow-hidden"
              >
                <Link to={`/product/${product.id}`}>
                  <div className="aspect-square relative">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.original_price && (
                      <span className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-lg">
                        -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <span className="text-xs text-primary font-medium">
                    {product.categories?.name}
                  </span>
                  <h3 className="font-bold text-foreground mt-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-primary">
                      {product.price.toLocaleString()} دج
                    </span>
                    {product.original_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {product.original_price.toLocaleString()} دج
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      variant="hero"
                      size="sm"
                      className="flex-1 gap-2"
                      disabled={!product.in_stock}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      أضف للسلة
                    </Button>
                    <Button
                      onClick={() => toggleFavorite(product.id)}
                      variant="outline"
                      size="icon"
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
