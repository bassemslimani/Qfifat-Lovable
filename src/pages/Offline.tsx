import { motion } from "framer-motion";
import { WifiOff, RefreshCw, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Offline() {
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-navigate to home when back online
      setTimeout(() => navigate("/"), 1000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [navigate]);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Try to fetch a small resource to check connectivity
      await fetch("/favicon.ico", { cache: "no-store" });
      navigate("/");
    } catch {
      // Still offline
      setIsRetrying(false);
    }
  };

  if (isOnline) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">تم استعادة الاتصال!</h2>
          <p className="text-muted-foreground">جاري تحويلك...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 pt-safe">
        <div className="container flex items-center justify-center">
          <h1 className="font-bold text-lg text-foreground">قفيفات</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6"
          >
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </motion.div>

          {/* Text */}
          <h2 className="text-2xl font-bold text-foreground mb-3">
            أنت غير متصل بالإنترنت
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            يبدو أنك فقدت الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              size="lg"
              className="w-full min-h-[48px]"
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-5 w-5 ml-2 animate-spin" />
                  جاري المحاولة...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 ml-2" />
                  إعادة المحاولة
                </>
              )}
            </Button>
          </div>

          {/* Cached Pages Info */}
          <div className="mt-10 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              يمكنك تصفح بعض الصفحات المحفوظة:
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="min-h-[44px]"
              >
                <Home className="h-4 w-4 ml-1" />
                الرئيسية
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/cart")}
                className="min-h-[44px]"
              >
                <ShoppingBag className="h-4 w-4 ml-1" />
                السلة
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Tips */}
      <footer className="bg-muted/50 p-4 pb-safe">
        <div className="container">
          <h3 className="font-semibold text-sm text-foreground mb-2">نصائح:</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• تحقق من اتصال Wi-Fi أو بيانات الهاتف</li>
            <li>• حاول الاقتراب من جهاز التوجيه</li>
            <li>• أعد تشغيل اتصال الإنترنت</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
