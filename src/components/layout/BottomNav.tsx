import { motion } from "framer-motion";
import { Home, Grid3X3, ShoppingCart, User, Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

export function BottomNav() {
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { icon: Home, label: "الرئيسية", path: "/" },
    { icon: Grid3X3, label: "الفئات", path: "/categories" },
    { icon: ShoppingCart, label: "السلة", path: "/cart", badge: itemCount },
    { icon: Heart, label: "المفضلة", path: "/favorites" },
    { icon: User, label: "حسابي", path: "/account" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-stretch h-16 pb-safe">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center flex-1 relative"
              whileTap={{ scale: 0.85 }}
            >
              {/* Active background pill */}
              {active && (
                <motion.div
                  layoutId="navPill"
                  className="absolute inset-x-2 top-1.5 bottom-1.5 bg-primary/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <div className="relative">
                  <item.icon
                    className={`h-[22px] w-[22px] transition-colors ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -left-2.5 min-w-[18px] h-[18px] bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </motion.span>
                  )}
                </div>
                <span
                  className={`text-[10px] leading-tight transition-colors ${
                    active ? "text-primary font-semibold" : "text-muted-foreground font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
