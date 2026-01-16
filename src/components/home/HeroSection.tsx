import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-32 h-32 border-4 border-current rounded-full" />
        <div className="absolute bottom-20 left-10 w-24 h-24 border-4 border-current rounded-full" />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 border-2 border-current rounded-full" />
      </div>

      <div className="container relative py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-sm rounded-full px-4 py-2 mb-4"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">صناعة حرفية جزائرية أصيلة</span>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            اكتشف جمال
            <br />
            <span className="text-accent">القفيفات الحرفية</span>
          </h1>

          <p className="text-primary-foreground/80 mb-6 text-base leading-relaxed">
            منتجات يدوية فريدة مصنوعة بحب وإتقان من مادة الحلقة الطبيعية
          </p>

          <div className="flex gap-3">
            <Button variant="accent" size="lg" className="group">
              تسوق الآن
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Button>
            <Button variant="glass" size="lg">
              استكشف الفئات
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex gap-8 mt-10 pt-6 border-t border-primary-foreground/20"
        >
          <div>
            <div className="text-2xl font-bold">+500</div>
            <div className="text-sm text-primary-foreground/70">منتج حرفي</div>
          </div>
          <div>
            <div className="text-2xl font-bold">+2000</div>
            <div className="text-sm text-primary-foreground/70">عميل سعيد</div>
          </div>
          <div>
            <div className="text-2xl font-bold">48</div>
            <div className="text-sm text-primary-foreground/70">ولاية</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
