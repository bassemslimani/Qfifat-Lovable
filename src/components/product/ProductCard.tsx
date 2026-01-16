import { motion } from "framer-motion";
import { Heart, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
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
          {!product.inStock && (
            <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-lg">
              نفذ المخزون
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 left-3 w-8 h-8 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <Heart className="h-4 w-4 text-muted-foreground" />
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
            onClick={() => addItem(product)}
            disabled={!product.inStock}
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
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
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
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
