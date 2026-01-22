import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingCart, Star, Minus, Plus, Truck, Shield, RefreshCw, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
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
      .limit(1);

    if (!error && data && data.length > 0) {
      setProduct(data[0] as Product);
    } else {
      console.error("Error fetching product:", error);
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

    toast({
      title: "تمت الإضافة",
      description: `تم إضافة ${quantity} ${product.name} إلى السلة`,
    });
  };

  const handleShare = async () => {
    if (!product || !product.price) return;

    const price = typeof product.price === 'number' ? product.price : Number(product.price);

    const shareData = {
      title: product.name,
      text: `${product.name} - ${price.toLocaleString()} دج`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "تم النسخ",
          description: "تم نسخ رابط المنتج للمشاركة",
        });
      }
    } catch (error) {
      console.log("Share cancelled or failed:", error);
    }
  };

  const discount = product?.original_price && product?.price
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
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
    <div className="min-h-screen bg-background">
      <Header />

      {/* Back Button - Desktop & Mobile */}
      <div className="container py-4 pt-20 lg:pt-24">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
          <span>رجوع</span>
        </button>
      </div>

      <main className="container pb-32 lg:pb-12">
        {/* Desktop: Two Column Layout / Mobile: Single Column */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16">

          {/* Left Column - Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductImageGallery
              images={allImages}
              productName={product.name}
              discount={discount}
              inStock={product.in_stock}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
              isToggling={isToggling}
              onShare={handleShare}
            />
          </div>

          {/* Right Column - Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 mt-6 lg:mt-0"
          >
            {/* Category */}
            <span className="inline-block text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
              {product.categories?.name}
            </span>

            {/* Title */}
            <h1 className="text-2xl lg:text-4xl font-bold text-foreground">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(product.rating)
                        ? "fill-accent text-accent"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-base font-semibold">{product.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({product.review_count} تقييم)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-3xl lg:text-4xl font-bold text-primary">
                {Number(product.price || 0).toLocaleString()} دج
              </span>
              {product.original_price && (
                <span className="text-lg lg:text-xl text-muted-foreground line-through">
                  {Number(product.original_price).toLocaleString()} دج
                </span>
              )}
              {discount && (
                <span className="text-sm font-bold text-white bg-accent px-2 py-1 rounded-lg">
                  وفر {discount}%
                </span>
              )}
            </div>

            {/* Stock Info */}
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${product.in_stock ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`font-medium ${product.in_stock ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {product.in_stock ? `متوفر في المخزون (${product.stock_quantity} قطعة)` : "غير متوفر حالياً"}
              </span>
            </div>

            {/* Description */}
            <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card border border-border/50">
              <h3 className="font-bold text-foreground mb-3 text-lg">وصف المنتج</h3>
              <p className="text-muted-foreground leading-relaxed lg:text-base">
                {product.description}
              </p>
            </div>

            {/* Features - Desktop: Horizontal / Mobile: Grid */}
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              <div className="bg-secondary rounded-xl p-4 text-center hover:bg-secondary/80 transition-colors">
                <Truck className="h-6 w-6 lg:h-7 lg:w-7 text-primary mx-auto mb-2" />
                <span className="text-xs lg:text-sm text-muted-foreground font-medium">توصيل سريع</span>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center hover:bg-secondary/80 transition-colors">
                <Shield className="h-6 w-6 lg:h-7 lg:w-7 text-primary mx-auto mb-2" />
                <span className="text-xs lg:text-sm text-muted-foreground font-medium">ضمان الجودة</span>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-center hover:bg-secondary/80 transition-colors">
                <RefreshCw className="h-6 w-6 lg:h-7 lg:w-7 text-primary mx-auto mb-2" />
                <span className="text-xs lg:text-sm text-muted-foreground font-medium">إرجاع مجاني</span>
              </div>
            </div>

            {/* Desktop Add to Cart Section */}
            <div className="hidden lg:block">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">الكمية:</span>
                  <div className="flex items-center gap-3 bg-secondary rounded-xl px-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="flex items-center justify-between py-3 border-t border-border">
                  <span className="font-medium text-foreground">المجموع:</span>
                  <span className="text-2xl font-bold text-primary">
                    {(Number(product.price) * quantity).toLocaleString()} دج
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    variant="hero"
                    size="lg"
                    className="flex-1 h-14 text-lg"
                    disabled={!product.in_stock}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    أضف للسلة
                  </Button>
                  <Button
                    onClick={() => toggleFavorite(product.id)}
                    variant="outline"
                    size="lg"
                    className={`h-14 w-14 ${isFavorite(product.id) ? "text-red-500 border-red-500" : ""}`}
                    disabled={isToggling}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite(product.id) ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="lg"
                    className="h-14 w-14"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <ProductReviews productId={product.id} />
          </motion.div>
        </div>
      </main>

      {/* Fixed Bottom - Add to Cart (Mobile Only) */}
      <div className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 lg:hidden">
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
              onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
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
