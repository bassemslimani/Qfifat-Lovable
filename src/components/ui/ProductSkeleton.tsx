import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-card">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="w-16 h-16 rounded-2xl" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

export function CategoryListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
      {Array.from({ length: count }).map((_, i) => (
        <CategorySkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="bg-gradient-hero p-6 space-y-4">
      <Skeleton className="h-6 w-40 bg-white/20" />
      <Skeleton className="h-10 w-64 bg-white/20" />
      <Skeleton className="h-4 w-48 bg-white/20" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-12 w-32 rounded-xl bg-white/20" />
        <Skeleton className="h-12 w-32 rounded-xl bg-white/20" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-14 pb-20">
      {/* Header skeleton */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50">
        <div className="container h-full flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container py-6 space-y-6">
        <HeroSkeleton />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <CategoryListSkeleton />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}

// Content-only skeleton (Header and Footer are NOT included - they render normally)
export function ContentSkeleton({ variant = "home" }: { variant?: "home" | "products" | "categories" | "details" }) {
  if (variant === "products") {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  if (variant === "categories") {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 space-y-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "details") {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="aspect-square w-full max-w-md mx-auto rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    );
  }

  // Default: home variant
  return (
    <div className="space-y-6">
      <HeroSkeleton />
      <div className="container space-y-4">
        <Skeleton className="h-6 w-32" />
        <CategoryListSkeleton />
      </div>
      <div className="container space-y-4">
        <Skeleton className="h-6 w-40" />
        <ProductGridSkeleton count={4} />
      </div>
      <div className="container space-y-4">
        <Skeleton className="h-6 w-36" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
