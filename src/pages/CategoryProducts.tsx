import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DynamicProductCard } from "@/components/product/DynamicProductCard";
import { BottomNav } from "@/components/layout/BottomNav";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
}

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

export default function CategoryProducts() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCategoryAndProducts();
    }
  }, [id]);

  const fetchCategoryAndProducts = async () => {
    setLoading(true);
    
    // Fetch category
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name, icon, description")
      .eq("id", id)
      .single();

    if (categoryData) {
      setCategory(categoryData);
    }

    // Fetch products in this category
    const { data: productsData } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("category_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (productsData) {
      setProducts(productsData as Product[]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pt-14 pb-20" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b pt-safe">
        <div className="container py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              {category?.icon && (
                <span className="text-2xl flex-shrink-0">{category.icon}</span>
              )}
              <h1 className="text-lg font-bold truncate">{category?.name || "جاري التحميل..."}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 pt-safe">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold mb-2">لا توجد منتجات</h2>
            <p className="text-muted-foreground">
              لا توجد منتجات في هذه الفئة حالياً
            </p>
          </div>
        ) : (
          <>
            {category?.description && (
              <p className="text-muted-foreground mb-6">{category.description}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product, index) => (
                <DynamicProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
