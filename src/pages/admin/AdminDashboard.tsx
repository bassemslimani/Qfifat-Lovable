import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  pendingPayments: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, pendingOrdersRes, pendingPaymentsRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("orders").select("id", { count: "exact" }),
        supabase.from("orders").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("payments").select("id", { count: "exact" }).eq("status", "pending"),
      ]);

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        pendingOrders: pendingOrdersRes.count || 0,
        pendingPayments: pendingPaymentsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { id: "products", label: "المنتجات", icon: Package },
    { id: "orders", label: "الطلبات", icon: ShoppingCart },
    { id: "payments", label: "المدفوعات", icon: CreditCard },
    { id: "users", label: "المستخدمين", icon: Users },
    { id: "settings", label: "الإعدادات", icon: Settings },
  ];

  const statCards = [
    {
      title: "إجمالي المنتجات",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "إجمالي الطلبات",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "طلبات قيد الانتظار",
      value: stats.pendingOrders,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      title: "مدفوعات تنتظر التحقق",
      value: stats.pendingPayments,
      icon: AlertCircle,
      color: "bg-red-100 text-red-700",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-card border-l border-border transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Qfifat" className="h-10 w-10" />
              <div>
                <h1 className="font-bold text-foreground">قفيفات</h1>
                <p className="text-xs text-muted-foreground">لوحة التحكم</p>
              </div>
            </div>
            <button
              className="lg:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              className="lg:hidden text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-bold text-foreground">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                م
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-6">
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl p-4 shadow-card"
                  >
                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <h3 className="font-bold text-foreground mb-4">إجراءات سريعة</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Package className="h-5 w-5" />
                    <span>إضافة منتج</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>تأكيد مدفوعات</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>تقارير المبيعات</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Settings className="h-5 w-5" />
                    <span>إعدادات الدفع</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "products" && (
            <AdminProducts />
          )}

          {activeTab === "orders" && (
            <AdminOrders />
          )}

          {activeTab === "payments" && (
            <AdminPayments />
          )}

          {activeTab === "settings" && (
            <AdminSettings />
          )}
        </div>
      </main>
    </div>
  );
}

// Products Management Component
function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">قائمة المنتجات ({products.length})</h3>
        <Button>إضافة منتج جديد</Button>
      </div>

      {products.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد منتجات بعد</p>
          <Button className="mt-4">أضف أول منتج</Button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-right px-4 py-3 text-sm font-medium">المنتج</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">السعر</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">المخزون</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">الحالة</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.price} دج</td>
                    <td className="px-4 py-3">{product.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {product.is_active ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">تعديل</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Orders Management Component
function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, payments(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    processing: "قيد التجهيز",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold">الطلبات ({orders.length})</h3>

      {orders.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد طلبات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-bold">#{order.order_number}</span>
                  <span className={`mr-2 px-2 py-1 rounded-full text-xs ${
                    order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    order.status === "delivered" ? "bg-primary/10 text-primary" :
                    "bg-secondary text-secondary-foreground"
                  }`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <span className="text-lg font-bold text-primary">{order.total} دج</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{order.shipping_name} - {order.shipping_wilaya}</p>
                <p>{new Date(order.created_at).toLocaleDateString("ar-DZ")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Payments Management Component
function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*, orders(order_number, shipping_name), payment_proofs(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPayments(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold">المدفوعات ({payments.length})</h3>

      {payments.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد مدفوعات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-bold">#{payment.orders?.order_number}</span>
                  <span className={`mr-2 px-2 py-1 rounded-full text-xs ${
                    payment.method === "barid" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {payment.method === "barid" ? "بريد الجزائر" : "Stripe"}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  payment.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  payment.status === "verified" ? "bg-primary/10 text-primary" :
                  "bg-red-100 text-red-700"
                }`}>
                  {payment.status === "pending" ? "قيد التحقق" :
                   payment.status === "verified" ? "مؤكد" : "فشل"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">{payment.amount} دج</span>
                {payment.method === "barid" && payment.status === "pending" && (
                  <Button size="sm">تأكيد الدفع</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings Component
function AdminSettings() {
  const [baridSettings, setBaridSettings] = useState({
    account_holder_name: "",
    ccp_number: "",
    ccp_key: "",
    rip_number: "",
    instructions: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("barid_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!error && data) {
      setBaridSettings(data);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    // Implementation for saving settings
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <h3 className="font-bold mb-4">إعدادات بريد الجزائر</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">اسم صاحب الحساب</label>
            <input
              type="text"
              value={baridSettings.account_holder_name}
              onChange={(e) => setBaridSettings({ ...baridSettings, account_holder_name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-border bg-background"
              placeholder="الاسم الكامل"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">رقم CCP</label>
              <input
                type="text"
                value={baridSettings.ccp_number}
                onChange={(e) => setBaridSettings({ ...baridSettings, ccp_number: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                placeholder="1234567890"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">المفتاح</label>
              <input
                type="text"
                value={baridSettings.ccp_key}
                onChange={(e) => setBaridSettings({ ...baridSettings, ccp_key: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                placeholder="00"
                dir="ltr"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">رقم RIP</label>
            <input
              type="text"
              value={baridSettings.rip_number || ""}
              onChange={(e) => setBaridSettings({ ...baridSettings, rip_number: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-border bg-background"
              placeholder="00799999..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">تعليمات الدفع</label>
            <textarea
              value={baridSettings.instructions || ""}
              onChange={(e) => setBaridSettings({ ...baridSettings, instructions: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-border bg-background h-24"
              placeholder="تعليمات إضافية للعملاء..."
            />
          </div>
          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </div>
    </div>
  );
}
