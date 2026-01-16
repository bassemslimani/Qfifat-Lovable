import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { DynamicProductCard } from "@/components/product/DynamicProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";

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
  category_id: string;
  categories?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "rating">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(id, name)")
        .eq("is_active", true),
      supabase
        .from("categories")
        .select("id, name, icon")
        .eq("is_active", true)
        .order("sort_order"),
    ]);

    if (!productsRes.error) setProducts(productsRes.data as Product[]);
    if (!categoriesRes.error) setCategories(categoriesRes.data as Category[]);
    setLoading(false);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    // Price filter
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // In stock filter
    if (inStockOnly) {
      result = result.filter((p) => p.in_stock);
    }

    // Sort
    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
      default:
        // Already sorted by created_at from query
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, priceRange, sortBy, inStockOnly]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setPriceRange([0, 50000]);
    setSortBy("newest");
    setInStockOnly(false);
  };

  const hasActiveFilters = 
    searchQuery || selectedCategory || priceRange[0] > 0 || priceRange[1] < 50000 || inStockOnly;

  return (
    <div className="min-h-screen bg-background pt-14 pb-20">
      <Header />

      <main className="container py-4 pt-safe">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="pr-11 pl-12 h-12 rounded-xl bg-card border-border"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute left-2 top-1/2 -translate-y-1/2 ${showFilters ? "text-primary" : ""}`}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Categories Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            الكل
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1 ${
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-2xl p-4 mb-4 shadow-card space-y-4"
          >
            {/* Price Range */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                نطاق السعر: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} دج
              </label>
              <Slider
                value={priceRange}
                min={0}
                max={50000}
                step={500}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                className="mt-2"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">الترتيب</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "newest", label: "الأحدث" },
                  { value: "price_asc", label: "السعر: من الأقل" },
                  { value: "price_desc", label: "السعر: من الأعلى" },
                  { value: "rating", label: "التقييم" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as any)}
                    className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                      sortBy === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">متوفر فقط</span>
            </label>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="w-full">
                <X className="h-4 w-4 ml-2" />
                مسح الفلاتر
              </Button>
            )}
          </motion.div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {filteredProducts.length} منتج
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-foreground mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground mb-4">
              جرب تغيير معايير البحث أو الفلاتر
            </p>
            <Button onClick={clearFilters}>مسح الفلاتر</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product, index) => (
              <DynamicProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
