import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, CheckCheck, Package, CreditCard, Store, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const typeIcons: Record<string, React.ElementType> = {
  order_update: Package,
  payment: CreditCard,
  merchant: Store,
  info: Info,
};

const typeColors: Record<string, string> = {
  order_update: "bg-primary/10 text-primary",
  payment: "bg-accent/10 text-accent",
  merchant: "bg-purple-100 text-purple-700",
  info: "bg-blue-100 text-blue-700",
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -left-1 h-5 w-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[100]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown - Centered on mobile, positioned on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:translate-y-0 sm:mt-2 w-auto sm:w-80 max-h-[70vh] bg-card rounded-2xl shadow-elevated border border-border z-[101] overflow-hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                <h3 className="font-bold text-foreground">الإشعارات</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <CheckCheck className="h-4 w-4 ml-1" />
                      قراءة الكل
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden h-8 w-8"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[50vh] sm:max-h-96">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    جاري التحميل...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">لا توجد إشعارات</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || Info;
                    const colorClass = typeColors[notification.type] || typeColors.info;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${
                          !notification.is_read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-foreground text-sm">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
