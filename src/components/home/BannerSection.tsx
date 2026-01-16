import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Percent, ArrowLeft } from "lucide-react";

export function BannerSection() {
  return (
    <section className="py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-accent/90 to-accent p-6 text-accent-foreground"
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary-foreground/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary-foreground/10 rounded-full translate-x-1/2 translate-y-1/2" />

          <div className="relative flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
              <Percent className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">عروض خاصة للتجار</h3>
              <p className="text-sm opacity-90 mb-3">
                سجل كتاجر واحصل على خصومات حصرية
              </p>
              <Button variant="secondary" size="sm" className="group">
                سجل الآن
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
