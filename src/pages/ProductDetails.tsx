import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Heart, ShoppingCart, Star, Minus, Plus, Share2, Truck, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductReviews } from "@/components/product/ProductReviews";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "@/hooks/use-toast";
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  images: string[];
  in_stock: boolean;
  stock_quantity: number;
  rating: number;
  review_count: number;
  category_id: string;
  categories?: { name: string };
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("id", id)
      .single();

    if (!error && data) {
      setProduct(data as Product);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    for (let i = 0; i < quantity; i++) {
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
    }
  };

  const discount = product?.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const allImages = product ? [product.image_url, ...(product.images || [])] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <h2 className="text-xl font-bold mb-4">المنتج غير موجود</h2>
          <Button onClick={() => navigate("/")}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      
      {/* Back Button */}
      <div className="container py-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-5 w-5" />
          <span>رجوع</span>
        </button>
      </div>

      <main className="container">
        {/* Image Gallery */}
        <div className="mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square rounded-2xl overflow-hidden bg-secondary"
          >
            <img
              src={allImages[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* Badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {discount && (
                <span className="bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded-lg">
                  -{discount}%
                </span>
              )}
              {!product.in_stock && (
                <span className="bg-muted text-muted-foreground text-sm font-medium px-3 py-1 rounded-lg">
                  نفذ المخزون
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="absolute top-4 left-4 flex gap-2">
              <button
                onClick={() => product && toggleFavorite(product.id)}
                disabled={isToggling}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${
                  product && isFavorite(product.id) ? "bg-red-500 text-white" : "bg-card text-muted-foreground"
                }`}
              >
                <Heart className={`h-5 w-5 ${product && isFavorite(product.id) ? "fill-current" : ""}`} />
              </button>
              <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-md text-muted-foreground">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </motion.div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${
                    selectedImage === index ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Category */}
          <span className="text-sm text-primary font-medium">
            {product.categories?.name}
          </span>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(product.rating)
                      ? "fill-accent text-accent"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({product.review_count} تقييم)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">
              {product.price.toLocaleString()} دج
            </span>
            {product.original_price && (
              <span className="text-lg text-muted-foreground line-through">
                {product.original_price.toLocaleString()} دج
              </span>
            )}
          </div>

          {/* Description */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <h3 className="font-bold text-foreground mb-2">الوصف</h3>
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Stock Info */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${product.in_stock ? "bg-primary" : "bg-destructive"}`} />
            <span className={product.in_stock ? "text-primary" : "text-destructive"}>
              {product.in_stock ? `متوفر (${product.stock_quantity} قطعة)` : "غير متوفر حالياً"}
            </span>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary rounded-xl p-3 text-center">
              <Truck className="h-5 w-5 text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">توصيل سريع</span>
            </div>
            <div className="bg-secondary rounded-xl p-3 text-center">
              <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">ضمان الجودة</span>
            </div>
            <div className="bg-secondary rounded-xl p-3 text-center">
              <RefreshCw className="h-5 w-5 text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">إرجاع مجاني</span>
            </div>
          </div>

          {/* Reviews Section */}
          <ProductReviews productId={product.id} />
        </motion.div>
      </main>

      {/* Fixed Bottom - Add to Cart */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border p-4">
        <div className="container flex items-center gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-2 bg-secondary rounded-xl px-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            variant="hero"
            size="lg"
            className="flex-1"
            disabled={!product.in_stock}
          >
            <ShoppingCart className="h-5 w-5" />
            أضف للسلة
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
