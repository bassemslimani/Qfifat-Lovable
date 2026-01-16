import { useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroSection } from "@/components/home/HeroSection";
import { DynamicCategorySection } from "@/components/home/DynamicCategorySection";
import { DynamicProductsSection } from "@/components/product/DynamicProductCard";
import { PromoSection } from "@/components/home/PromoSection";
import { BannerSection } from "@/components/home/BannerSection";
import { InstallBanner } from "@/components/home/InstallBanner";
import { PullToRefresh } from "@/components/pwa/PullToRefresh";
import { useAuth } from "@/hooks/useAuth";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    // Invalidate all queries to refetch data
    await queryClient.invalidateQueries();
    // Add a small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [queryClient]);

  const { isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <div className="min-h-screen bg-background pt-14 pb-20">
      <Header />
      <PullToRefresh
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        progress={progress}
      />
      <main className="pt-safe">
        <HeroSection />
        <InstallBanner />
        <DynamicCategorySection />
        <DynamicProductsSection title="منتجات مميزة" featured={true} />
        <PromoSection />
        <BannerSection />
        <DynamicProductsSection title="وصل حديثاً" limit={8} />
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
