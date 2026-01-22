import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { createPortal } from "react-dom";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  const getIcon = (variant?: string) => {
    if (variant === "destructive") {
      return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
    return <CheckCircle2 className="h-8 w-8 text-green-500" />;
  };

  // Don't render anything if no toasts
  if (toasts.length === 0) return null;

  return createPortal(
    <AnimatePresence>
      {toasts.map(function ({ id, title, description, variant }) {
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
            onClick={() => dismiss(id)}
          >
            {/* Blurry backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
            />

            {/* Toast content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl ${
                variant === "destructive"
                  ? "bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {/* Close button */}
              <button
                onClick={() => dismiss(id)}
                className="absolute top-3 left-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>

              <div className="flex flex-col items-center text-center gap-3">
                {/* Icon */}
                <div className={`p-3 rounded-full ${
                  variant === "destructive"
                    ? "bg-red-100 dark:bg-red-900/50"
                    : "bg-green-100 dark:bg-green-900/50"
                }`}>
                  {getIcon(variant)}
                </div>

                {/* Title */}
                {title && (
                  <h3 className={`text-lg font-bold ${
                    variant === "destructive"
                      ? "text-red-800 dark:text-red-200"
                      : "text-gray-900 dark:text-white"
                  }`}>
                    {title}
                  </h3>
                )}

                {/* Description */}
                {description && (
                  <p className={`text-sm ${
                    variant === "destructive"
                      ? "text-red-600 dark:text-red-300"
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {description}
                  </p>
                )}

                {/* Tap to dismiss hint */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  اضغط في أي مكان للإغلاق
                </p>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </AnimatePresence>,
    document.body
  );
}
