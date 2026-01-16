import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Grid3X3, ChevronLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  image_url: string | null;
  description: string | null;
  product_count?: number;
}

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch categories with product count
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (categoriesError) throw categoriesError;

      // Get product count for each category
      const categoriesWithCount = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("is_active", true);

          return {
            ...category,
            product_count: count || 0,
          };
        })
      );

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/products?category=${categoryId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-14">
        <Header />
        <div className="container py-12 pt-safe flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 pb-20">
      <Header />

      <main className="container py-6 pt-safe">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground mb-6"
        >
          <Grid3X3 className="h-10 w-10 mb-3" />
          <h1 className="text-2xl font-bold mb-1">الفئات</h1>
          <p className="text-primary-foreground/80 text-sm">
            تصفح منتجاتنا حسب الفئة
          </p>
        </motion.div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center shadow-card">
            <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد فئات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategoryClick(category.id)}
                className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all group text-right"
              >
                {/* Category Image or Icon */}
                <div className="relative h-28 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">{category.icon || "📦"}</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Category Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-right">
                      <h3 className="font-bold text-foreground line-clamp-1">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.product_count} منتج
                      </p>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
