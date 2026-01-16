import { motion } from "framer-motion";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { useState, useEffect } from "react";

export function InstallBanner() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user dismissed the banner
    const dismissedAt = localStorage.getItem("install-banner-dismissed");
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 3) {
        setDismissed(true);
      }
    }

    // Show banner after a short delay
    if (isInstallable && !dismissed && !isInstalled) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed, isInstalled]);

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("install-banner-dismissed", Date.now().toString());
  };

  if (!showBanner || isInstalled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-4 mb-4"
    >
      <div className="relative bg-gradient-to-l from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 border border-primary/20">
        <button
          onClick={handleDismiss}
          className="absolute top-2 left-2 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm">ثبّت التطبيق على جهازك</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              تصفح أسرع وإشعارات فورية
            </p>
          </div>
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-shrink-0 min-h-[40px] px-4"
          >
            <Download className="h-4 w-4 ml-1" />
            تثبيت
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
