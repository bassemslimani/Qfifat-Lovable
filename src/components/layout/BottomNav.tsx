import { motion } from "framer-motion";
import { Home, Grid3X3, ShoppingCart, User, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

export function BottomNav() {
  const { itemCount } = useCart();

  const navItems: NavItem[] = [
    { icon: Home, label: "الرئيسية", path: "/" },
    { icon: Grid3X3, label: "الفئات", path: "/categories" },
    { icon: ShoppingCart, label: "السلة", path: "/cart", badge: itemCount },
    { icon: Heart, label: "المفضلة", path: "/favorites" },
    { icon: User, label: "حسابي", path: "/account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item, index) => (
          <motion.button
            key={item.path}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative text-muted-foreground hover:text-primary transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -left-2 h-4 w-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </motion.span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
            {index === 0 && (
              <motion.div
                layoutId="activeTab"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full"
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
}
