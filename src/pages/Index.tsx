import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroSection } from "@/components/home/HeroSection";
import { CategorySection } from "@/components/home/CategorySection";
import { ProductsSection } from "@/components/home/ProductsSection";
import { PromoSection } from "@/components/home/PromoSection";
import { BannerSection } from "@/components/home/BannerSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <ProductsSection title="منتجات مميزة" />
        <PromoSection />
        <BannerSection />
        <ProductsSection title="وصل حديثاً" />
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
