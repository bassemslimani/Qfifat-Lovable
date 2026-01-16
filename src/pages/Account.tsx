import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, ShoppingBag, Heart, MapPin, CreditCard, 
  LogOut, ChevronLeft, Settings, Store, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  full_name: string;
  phone: string;
  wilaya: string;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
}

export default function Account() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "settings">("orders");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchOrders();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    if (data) setProfile(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setOrders(data as Order[]);
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "مؤكد", color: "bg-blue-100 text-blue-700" },
    processing: { label: "قيد التجهيز", color: "bg-purple-100 text-purple-700" },
    shipped: { label: "تم الشحن", color: "bg-orange-100 text-orange-700" },
    delivered: { label: "تم التسليم", color: "bg-primary/10 text-primary" },
    cancelled: { label: "ملغي", color: "bg-red-100 text-red-700" },
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container py-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile?.full_name || "مستخدم"}</h1>
              <p className="text-primary-foreground/70 text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <button 
              onClick={() => navigate("/merchant")}
              className="bg-primary-foreground/10 rounded-xl p-3 text-center"
            >
              <ShoppingBag className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs">لوحة البائع</span>
            </button>
            <button className="bg-primary-foreground/10 rounded-xl p-3 text-center">
              <Heart className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs">المفضلة</span>
            </button>
            <button 
              onClick={() => navigate("/become-merchant")}
              className="bg-primary-foreground/10 rounded-xl p-3 text-center"
            >
              <Store className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs">كن بائعاً</span>
            </button>
          </div>
        </motion.div>

        {/* Admin Link */}
        {isAdmin && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate("/admin")}
            className="w-full bg-accent/10 border border-accent rounded-xl p-4 flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-accent" />
              <span className="font-medium text-foreground">لوحة تحكم المدير</span>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        )}

        {/* Tabs */}
        <div className="flex bg-secondary rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "orders"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            طلباتي
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            الإعدادات
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="bg-card rounded-2xl p-8 text-center shadow-card">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد طلبات بعد</p>
                <Button onClick={() => navigate("/")} className="mt-4">
                  ابدأ التسوق
                </Button>
              </div>
            ) : (
              orders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-4 shadow-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">#{order.order_number}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      statusLabels[order.status]?.color || "bg-secondary"
                    }`}>
                      {statusLabels[order.status]?.label || order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("ar-DZ")}
                    </span>
                    <span className="font-bold text-primary">{order.total} دج</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-3">
            <button className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <span className="font-medium">تعديل الملف الشخصي</span>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <button className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">عناوين التوصيل</span>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <button className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <span className="font-medium">الإشعارات</span>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>

            <Button
              variant="outline"
              className="w-full mt-4 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
