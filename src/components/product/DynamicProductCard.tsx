import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  in_stock: boolean;
  rating: number;
  review_count: number;
  categories?: { name: string };
}

interface DynamicProductCardProps {
  product: Product;
  index?: number;
}

export function DynamicProductCard({ product, index = 0 }: DynamicProductCardProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  
  const isProductFavorite = isFavorite(product.id);
  
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      originalPrice: product.original_price || undefined,
      image: product.image_url,
      category: product.categories?.name || "",
      inStock: product.in_stock,
      rating: product.rating,
      reviewCount: product.review_count,
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => navigate(`/product/${product.id}`)}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {discount && (
            <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-lg">
              -{discount}%
            </span>
          )}
          {!product.in_stock && (
            <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-lg">
              نفذ المخزون
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleFavorite}
          disabled={isToggling}
          className={cn(
            "absolute top-3 left-3 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-colors",
            isProductFavorite 
              ? "bg-red-500 text-white" 
              : "bg-card/80 text-muted-foreground hover:bg-card"
          )}
        >
          <Heart className={cn("h-4 w-4", isProductFavorite && "fill-current")} />
        </motion.button>

        {/* Quick Add */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-3 right-3"
        >
          <Button
            variant="hero"
            size="sm"
            className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleAddToCart}
            disabled={!product.in_stock}
          >
            <Plus className="h-4 w-4" />
            أضف للسلة
          </Button>
        </motion.div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.review_count})</span>
        </div>

        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {product.price.toLocaleString()} دج
          </span>
          {product.original_price && (
            <span className="text-sm text-muted-foreground line-through">
              {product.original_price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface DynamicProductsSectionProps {
  title: string;
  categoryId?: string;
  featured?: boolean;
  limit?: number;
}

export function DynamicProductsSection({ 
  title, 
  categoryId, 
  featured,
  limit = 8 
}: DynamicProductsSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [categoryId, featured]);

  const fetchProducts = async () => {
    let query = supabase
      .from("products")
      .select("*, categories(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (featured) {
      query = query.eq("is_featured", true);
    }

    const { data, error } = await query;

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="container">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-secondary rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-secondary rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button 
            onClick={() => navigate("/products")}
            className="text-sm text-primary font-medium"
          >
            عرض الكل
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <DynamicProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
