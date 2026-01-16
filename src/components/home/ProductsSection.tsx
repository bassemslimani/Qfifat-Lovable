import { products } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";

interface ProductsSectionProps {
  title: string;
  showAll?: boolean;
}

export function ProductsSection({ title, showAll = true }: ProductsSectionProps) {
  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {showAll && (
            <button className="text-sm text-primary font-medium">عرض الكل</button>
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
