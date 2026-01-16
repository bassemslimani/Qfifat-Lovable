import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroSection } from "@/components/home/HeroSection";
import { DynamicCategorySection } from "@/components/home/DynamicCategorySection";
import { DynamicProductsSection } from "@/components/product/DynamicProductCard";
import { PromoSection } from "@/components/home/PromoSection";
import { BannerSection } from "@/components/home/BannerSection";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main>
        <HeroSection />
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
