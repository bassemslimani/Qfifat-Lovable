import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Wifi, WifiOff, Bell, RefreshCw, Zap, Globe, ShieldCheck, Share, PlusSquare, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import logo from "@/assets/logo.png";

export function InstallPrompt() {
  const { isInstallable, isInstalled, isOnline, isUpdating, isIOSDevice, installApp, updateApp, requestNotificationPermission } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user dismissed before
    const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }

    // Show prompt after delay
    if (isInstallable && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed]);

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setShowPrompt(false);
      // Request notification permission after install
      await requestNotificationPermission();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  return (
    <>
      {/* Offline Banner — below safe area + header */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] pt-safe"
          >
            <div className="mt-14 mx-3 bg-yellow-500 text-yellow-900 py-2.5 px-4 rounded-xl text-center text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
              <WifiOff className="h-4 w-4 flex-shrink-0" />
              أنت غير متصل بالإنترنت
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Available Banner — below safe area + header */}
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] pt-safe"
          >
            <div className="mt-14 mx-3 bg-primary text-primary-foreground py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
              <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
              <span>تحديث جديد متاح</span>
              <Button size="sm" variant="secondary" onClick={updateApp} className="mr-1 h-7 rounded-lg text-xs">
                تحديث
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Prompt - Professional Design */}
      <AnimatePresence>
        {showPrompt && !isInstalled && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-4 right-4 z-[100] bg-card rounded-2xl shadow-elevated border border-border overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-hero p-4 relative">
              <button
                onClick={handleDismiss}
                className="absolute top-3 left-3 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
                  <img src={logo} alt="Qfifat DZ" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Qfifat DZ</h3>
                  <p className="text-white/80 text-sm">التطبيق الرسمي</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-foreground font-medium mb-3">
                ثبّت التطبيق للحصول على تجربة مميزة
              </p>

              {/* iOS Instructions */}
              {isIOSDevice ? (
                <>
                  <div className="bg-secondary/50 rounded-xl p-3 mb-4">
                    <p className="text-sm font-medium text-foreground mb-3">خطوات التثبيت على iPhone:</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Share className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          1. اضغط على زر المشاركة <span className="inline-block px-1.5 py-0.5 bg-secondary rounded text-xs">⬆️</span> في الأسفل
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <PlusSquare className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          2. اختر "إضافة إلى الشاشة الرئيسية"
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Smartphone className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          3. اضغط "إضافة" في الأعلى
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Single dismiss button for iOS */}
                  <Button onClick={handleDismiss} variant="outline" className="w-full h-11">
                    فهمت، سأثبته لاحقاً
                  </Button>
                </>
              ) : (
                <>
                  {/* Features for non-iOS */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center text-center p-2 rounded-xl bg-secondary/50">
                      <Zap className="h-5 w-5 text-primary mb-1" />
                      <span className="text-xs text-muted-foreground">سرعة فائقة</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-2 rounded-xl bg-secondary/50">
                      <Globe className="h-5 w-5 text-primary mb-1" />
                      <span className="text-xs text-muted-foreground">بدون انترنت</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-2 rounded-xl bg-secondary/50">
                      <Bell className="h-5 w-5 text-primary mb-1" />
                      <span className="text-xs text-muted-foreground">إشعارات فورية</span>
                    </div>
                  </div>

                  {/* Buttons for non-iOS */}
                  <div className="flex gap-2">
                    <Button onClick={handleInstall} className="flex-1 h-11">
                      <Download className="h-4 w-4 ml-2" />
                      تثبيت التطبيق
                    </Button>
                    <Button onClick={handleDismiss} variant="outline" className="h-11 px-4">
                      لاحقاً
                    </Button>
                  </div>
                </>
              )}

              {/* Footer note */}
              <p className="text-[10px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                آمن وموثوق - لا يحتاج مساحة كبيرة
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);

    // Show prompt if not decided yet
    if (Notification.permission === "default") {
      const timer = setTimeout(() => setShowPrompt(true), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    setShowPrompt(false);

    if (result === "granted") {
      new Notification("مرحباً بك! 🎉", {
        body: "ستتلقى إشعارات بالعروض الجديدة وتحديثات الطلبات",
        icon: "/pwa-192x192.png",
      });
    }
  };

  if (permission !== "default" || !showPrompt) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-20 left-4 right-4 z-[100] bg-card rounded-2xl shadow-elevated p-4 border border-border"
    >
      <button
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 left-2 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Bell className="h-7 w-7 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground mb-1">تفعيل الإشعارات</h3>
          <p className="text-sm text-muted-foreground mb-3">
            احصل على إشعارات فورية بالعروض الجديدة وتتبع حالة طلباتك
          </p>
          <div className="flex gap-2">
            <Button onClick={handleAllow} size="sm" className="flex-1">
              <Bell className="h-4 w-4 ml-1" />
              تفعيل
            </Button>
            <Button onClick={() => setShowPrompt(false)} size="sm" variant="outline">
              لاحقاً
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
