import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      
      // Hide reconnected message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
      
      // If on offline page, navigate back
      if (location.pathname === "/offline") {
        navigate("/");
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [navigate, location.pathname]);

  return (
    <AnimatePresence>
      {/* Offline Banner */}
      {!isOnline && location.pathname !== "/offline" && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-yellow-500 text-yellow-900 py-3 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 pt-safe"
        >
          <WifiOff className="h-4 w-4" />
          <span>أنت غير متصل بالإنترنت</span>
        </motion.div>
      )}

      {/* Reconnected Toast */}
      {showReconnected && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-primary text-primary-foreground py-3 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 pt-safe"
        >
          <Wifi className="h-4 w-4" />
          <span>تم استعادة الاتصال بالإنترنت</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
