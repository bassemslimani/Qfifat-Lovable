import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  icon: string;
}

export function DynamicCategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, icon")
      .eq("is_active", true)
      .order("sort_order");

    if (!error && data) {
      setCategories(data);
    }
  };

  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">الفئات</h2>
          <button 
            onClick={() => navigate("/categories")}
            className="text-sm text-primary font-medium"
          >
            عرض الكل
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/category/${category.id}`)}
              className="flex flex-col items-center gap-2 min-w-[80px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-2xl shadow-card hover:shadow-elevated transition-shadow hover:bg-primary/10">
                {category.icon || "📦"}
              </div>
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                {category.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
