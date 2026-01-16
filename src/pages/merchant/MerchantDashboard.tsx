import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  LogOut,
  Menu,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ProductForm } from "@/components/admin/ProductForm";
import { MerchantOrders } from "@/components/merchant/MerchantOrders";
import { MerchantEarnings } from "@/components/merchant/MerchantEarnings";
import logo from "@/assets/logo.png";

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  is_active: boolean;
  stock_quantity: number;
  categories?: { name: string };
}

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMerchant, setIsMerchant] = useState(false);
  const [merchantStatus, setMerchantStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkMerchantStatus();
    }
  }, [user]);

  const checkMerchantStatus = async () => {
    // Check if user has merchant role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id)
      .single();

    if (roleData?.role === "merchant" || roleData?.role === "admin") {
      setIsMerchant(true);
      setMerchantStatus("approved");
      fetchStats();
      fetchProducts();
    } else {
      // Check merchant request status
      const { data: requestData } = await supabase
        .from("merchant_requests")
        .select("status")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setMerchantStatus(requestData?.status || null);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: productsData } = await supabase
        .from("products")
        .select("id, is_active");

      const totalProducts = productsData?.length || 0;
      const activeProducts = productsData?.filter((p) => p.is_active).length || 0;

      setStats({
        totalProducts,
        activeProducts,
        totalOrders: 0,
        totalRevenue: 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoadingProducts(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast({ title: "خطأ في حذف المنتج", variant: "destructive" });
    } else {
      toast({ title: "تم حذف المنتج بنجاح" });
      fetchProducts();
      fetchStats();
    }
  };

  const handleToggleActive = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (!error) {
      fetchProducts();
    }
  };

  const menuItems = [
    { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { id: "products", label: "منتجاتي", icon: Package },
    { id: "orders", label: "الطلبات", icon: ShoppingCart },
    { id: "earnings", label: "الأرباح", icon: CreditCard },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not a merchant - show status
  if (!isMerchant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-8 shadow-card max-w-md w-full text-center"
        >
          {merchantStatus === "pending" ? (
            <>
              <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">طلبك قيد المراجعة</h1>
              <p className="text-muted-foreground mb-6">
                سيتم مراجعة طلبك والرد عليك خلال 48 ساعة
              </p>
            </>
          ) : merchantStatus === "rejected" ? (
            <>
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">تم رفض طلبك</h1>
              <p className="text-muted-foreground mb-6">
                يمكنك التواصل معنا لمعرفة السبب أو إعادة التقديم
              </p>
            </>
          ) : (
            <>
              <Package className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">لست بائعاً بعد</h1>
              <p className="text-muted-foreground mb-6">
                قدم طلب للانضمام كبائع وابدأ ببيع منتجاتك
              </p>
            </>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
              العودة للرئيسية
            </Button>
            {!merchantStatus && (
              <Button onClick={() => navigate("/become-merchant")} className="flex-1">
                تقديم طلب
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Overlay */}
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
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Qfifat" className="h-10 w-10" />
              <div>
                <h1 className="font-bold text-foreground">قفيفات</h1>
                <p className="text-xs text-muted-foreground">لوحة البائع</p>
              </div>
            </div>
            <button
              className="lg:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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

          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => navigate("/")}
            >
              <Eye className="h-5 w-5" />
              زيارة المتجر
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
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
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Package className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-3">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{stats.activeProducts}</p>
                  <p className="text-sm text-muted-foreground">منتجات نشطة</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center mb-3">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">الطلبات</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{stats.totalRevenue} دج</p>
                  <p className="text-sm text-muted-foreground">الأرباح</p>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-card">
                <h3 className="font-bold mb-4">ابدأ الآن</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      setActiveTab("products");
                      setShowProductForm(true);
                    }}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <Plus className="h-6 w-6" />
                    <span>إضافة منتج جديد</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("products")}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <Package className="h-6 w-6" />
                    <span>إدارة المنتجات</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold">منتجاتي ({products.length})</h3>
                <Button onClick={() => setShowProductForm(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة منتج
                </Button>
              </div>

              {loadingProducts ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : products.length === 0 ? (
                <div className="bg-card rounded-2xl p-8 text-center shadow-card">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">لا توجد منتجات بعد</p>
                  <Button onClick={() => setShowProductForm(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    أضف أول منتج
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card rounded-2xl overflow-hidden shadow-card"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.is_active
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {product.is_active ? "نشط" : "معطل"}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold line-clamp-1">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {product.categories?.name || "بدون فئة"}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-primary">
                            {product.price} دج
                          </span>
                          <span className="text-sm text-muted-foreground">
                            المخزون: {product.stock_quantity}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setEditingProduct(product);
                              setShowProductForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(product)}
                          >
                            {product.is_active ? "تعطيل" : "تفعيل"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <MerchantOrders />
          )}

          {/* Earnings Tab */}
          {activeTab === "earnings" && (
            <MerchantEarnings />
          )}
        </div>
      </main>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showProductForm && (
          <ProductForm
            product={editingProduct}
            onClose={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
            onSave={() => {
              setShowProductForm(false);
              setEditingProduct(null);
              fetchProducts();
              fetchStats();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
