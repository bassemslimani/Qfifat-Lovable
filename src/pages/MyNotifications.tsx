import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BellOff,
  Package,
  CreditCard,
  Store,
  Info,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data: Record<string, any> | null;
}

export default function MyNotifications() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("تم تحديد جميع الإشعارات كمقروءة");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_update":
        return Package;
      case "payment":
        return CreditCard;
      case "merchant":
        return Store;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order_update":
        return "bg-blue-100 text-blue-600";
      case "payment":
        return "bg-green-100 text-green-600";
      case "merchant":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString("ar-DZ");
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">الإشعارات</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} إشعار غير مقروء
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 ml-1" />
                قراءة الكل
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Filter Tabs */}
        <div className="flex bg-secondary rounded-xl p-1 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            الكل ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === "unread"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            غير مقروء ({unreadCount})
          </button>
        </div>

        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-8 text-center shadow-card"
          >
            <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">
              {filter === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات"}
            </h2>
            <p className="text-muted-foreground">
              ستظهر هنا إشعارات الطلبات والمدفوعات
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                    className={`bg-card rounded-2xl p-4 shadow-card cursor-pointer transition-all ${
                      !notification.is_read
                        ? "border-r-4 border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        {!notification.is_read && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                            <Check className="h-3 w-3" />
                            <span>انقر للتحديد كمقروء</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
