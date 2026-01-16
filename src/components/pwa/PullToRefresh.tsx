import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  progress: number;
}

export function PullToRefresh({ isRefreshing, pullDistance, progress }: PullToRefreshProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-14 left-0 right-0 flex justify-center z-[60] pointer-events-none pt-safe"
      style={{
        transform: `translateY(${Math.min(pullDistance, 60)}px)`,
      }}
    >
      <div
        className={`w-10 h-10 rounded-full bg-card shadow-elevated flex items-center justify-center border border-border ${
          isRefreshing ? "animate-pulse" : ""
        }`}
      >
        <RefreshCw
          className={`h-5 w-5 text-primary transition-transform ${
            isRefreshing ? "animate-spin" : ""
          }`}
          style={{
            transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        />
      </div>
    </motion.div>
  );
}
