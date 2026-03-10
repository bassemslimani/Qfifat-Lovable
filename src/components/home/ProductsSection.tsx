import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProductCard } from "@/components/product/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

interface ProductsSectionProps {
  title: string;
  showAll?: boolean;
}

export function ProductsSection({ title, showAll = true }: ProductsSectionProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, categories(name)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (!error && data) {
          setProducts(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description || "",
              price: p.price,
              originalPrice: p.original_price || undefined,
              image: p.image_url || "/placeholder.svg",
              category: p.categories?.name || "",
              inStock: p.in_stock ?? true,
              rating: p.rating || 0,
              reviewCount: p.review_count || 0,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-8">
        <div className="container">
          <h2 className="text-xl font-bold text-foreground mb-6">{title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-card animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {showAll && (
            <button
              onClick={() => navigate("/products")}
              className="text-sm text-primary font-medium"
            >
              عرض الكل
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
