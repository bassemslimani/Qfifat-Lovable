import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">السلة فارغة</h2>
            <p className="text-muted-foreground mb-6">
              لم تضف أي منتجات بعد، ابدأ التسوق الآن!
            </p>
            <Button onClick={() => navigate("/")} variant="hero">
              تصفح المنتجات
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      <main className="container py-6">
        <h1 className="text-xl font-bold text-foreground mb-6">
          سلة التسوق ({items.length} منتج)
        </h1>

        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-4 shadow-card flex gap-4"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-primary font-bold">{item.price.toLocaleString()} دج</p>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-secondary rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Fixed Bottom */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">المجموع</span>
          <span className="text-xl font-bold text-primary">{total.toLocaleString()} دج</span>
        </div>
        <Button onClick={handleCheckout} variant="hero" size="lg" className="w-full">
          إتمام الطلب
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
