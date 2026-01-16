import { motion } from "framer-motion";
import { Truck, Shield, Headphones, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "توصيل سريع",
    description: "إلى جميع الولايات",
  },
  {
    icon: Shield,
    title: "دفع آمن",
    description: "بريد الجزائر أو Stripe",
  },
  {
    icon: RefreshCw,
    title: "إرجاع مجاني",
    description: "خلال 7 أيام",
  },
  {
    icon: Headphones,
    title: "دعم متواصل",
    description: "نحن هنا لمساعدتك",
  },
];

export function PromoSection() {
  return (
    <section className="py-8 bg-secondary/50">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center p-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
