import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Wifi, WifiOff, Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export function InstallPrompt() {
  const { isInstallable, isInstalled, isOnline, isUpdating, installApp, updateApp, requestNotificationPermission } = usePWA();
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
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-900 py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2"
          >
            <WifiOff className="h-4 w-4" />
            أنت غير متصل بالإنترنت - بعض الميزات قد لا تعمل
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Available Banner */}
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            تحديث جديد متاح
            <Button size="sm" variant="secondary" onClick={updateApp} className="mr-2 h-7">
              تحديث الآن
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Prompt */}
      <AnimatePresence>
        {showPrompt && !isInstalled && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-[100] bg-card rounded-2xl shadow-elevated p-4 border border-border"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-2 left-2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">ثبّت تطبيق قفيفات</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  احصل على تجربة أفضل مع التطبيق: إشعارات فورية، تصفح بدون إنترنت، وسرعة أكبر
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleInstall} size="sm" className="flex-1">
                    <Download className="h-4 w-4 ml-1" />
                    تثبيت
                  </Button>
                  <Button onClick={handleDismiss} size="sm" variant="outline">
                    لاحقاً
                  </Button>
                </div>
              </div>
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
