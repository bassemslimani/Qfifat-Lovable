import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: "معلق", color: "text-yellow-600", bg: "bg-yellow-50", icon: Clock },
  confirmed: { label: "مؤكد", color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle },
  processing: { label: "قيد التجهيز", color: "text-purple-600", bg: "bg-purple-50", icon: Package },
  shipped: { label: "تم الشحن", color: "text-indigo-600", bg: "bg-indigo-50", icon: Truck },
  delivered: { label: "تم التوصيل", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
  cancelled: { label: "ملغي", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
};

const CATEGORY_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444", "#06b6d4", "#84cc16"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-sm" dir="rtl">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center justify-between gap-4">
          <span>{entry.name}</span>
          <span className="font-bold">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export const AdminStats = () => {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id");
      if (error) throw error;
      return { count: data?.length || 0 };
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin-products-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id");
      if (error) throw error;
      return { count: data?.length || 0 };
    },
  });

  const { data: categorySales = [] } = useQuery({
    queryKey: ["admin-category-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, products:products(count)");
      if (error) throw error;
      return data
        .map((cat: any) => ({ name: cat.name, value: cat.products?.[0]?.count || 0 }))
        .filter((c: any) => c.value > 0)
        .sort((a: any, b: any) => b.value - a.value);
    },
  });

  // Stats calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = orders.filter((order) => {
      const d = new Date(order.created_at);
      return d >= startOfDay(date) && d <= endOfDay(date);
    });
    return {
      name: format(date, "EEE", { locale: ar }),
      fullDate: format(date, "d MMM", { locale: ar }),
      إيرادات: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      طلبات: dayOrders.length,
    };
  });

  // Growth calc
  const last7DaysRevenue = last7Days.reduce((sum, d) => sum + d["إيرادات"], 0);
  const prev7DaysOrders = orders.filter((order) => {
    const d = new Date(order.created_at);
    return d >= startOfDay(subDays(new Date(), 13)) && d <= endOfDay(subDays(new Date(), 7));
  });
  const prev7DaysRevenue = prev7DaysOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const growth = prev7DaysRevenue > 0
    ? ((last7DaysRevenue - prev7DaysRevenue) / prev7DaysRevenue) * 100
    : 0;

  // Order status counts
  const statusCounts = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    key,
    ...config,
    count: orders.filter((o) => o.status === key).length,
  })).filter((s) => s.count > 0);

  // Category total for percentage calc
  const categoryTotal = categorySales.reduce((sum: number, c: any) => sum + c.value, 0);

  return (
    <div className="space-y-6">
      {/* ---- KPI Cards ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">إجمالي الإيرادات</p>
                <p className="text-lg sm:text-2xl font-bold mt-1 truncate">{totalRevenue.toLocaleString()} <span className="text-sm font-normal">د.ج</span></p>
              </div>
              <div className="bg-emerald-100 p-2.5 rounded-xl flex-shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs">
              {growth >= 0 ? (
                <><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500 font-medium">+{growth.toFixed(0)}%</span></>
              ) : (
                <><TrendingDown className="w-3.5 h-3.5 text-red-500" /><span className="text-red-500 font-medium">{growth.toFixed(0)}%</span></>
              )}
              <span className="text-muted-foreground">vs الأسبوع الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">إجمالي الطلبات</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{totalOrders}</p>
              </div>
              <div className="bg-blue-100 p-2.5 rounded-xl flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <span className="text-emerald-500 font-medium">{deliveredOrders}</span> تم توصيلها &bull; <span className="text-yellow-500 font-medium">{pendingOrders}</span> معلقة
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">المستخدمين</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{usersData?.count || 0}</p>
              </div>
              <div className="bg-violet-100 p-2.5 rounded-xl flex-shrink-0">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              متوسط الطلب: <span className="font-medium text-foreground">{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} د.ج</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">المنتجات</p>
                <p className="text-lg sm:text-2xl font-bold mt-1">{productsData?.count || 0}</p>
              </div>
              <div className="bg-amber-100 p-2.5 rounded-xl flex-shrink-0">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {categorySales.length} فئة نشطة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Revenue Area Chart ---- */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">الإيرادات - آخر 7 أيام</CardTitle>
        </CardHeader>
        <CardContent className="pr-0 sm:pr-2">
          <div className="h-[220px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="إيرادات" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGrad)" name="إيرادات (د.ج)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ---- Orders Bar Chart + Order Status ---- */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">الطلبات اليومية</CardTitle>
          </CardHeader>
          <CardContent className="pr-0 sm:pr-2">
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="طلبات" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={28} name="عدد الطلبات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status - Clean card-based layout instead of pie chart */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">حالات الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {statusCounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">لا توجد طلبات بعد</div>
            ) : (
              <div className="space-y-3">
                {statusCounts.map((s) => {
                  const pct = totalOrders > 0 ? (s.count / totalOrders) * 100 : 0;
                  const Icon = s.icon;
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <div className={`${s.bg} p-2 rounded-lg flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{s.label}</span>
                          <span className="text-sm text-muted-foreground">{s.count} <span className="text-xs">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: `var(--${s.key === "pending" ? "yellow" : s.key === "delivered" ? "green" : s.key === "cancelled" ? "red" : "blue"})` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Category Distribution - Horizontal bars instead of pie chart ---- */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">توزيع المنتجات حسب الفئة</CardTitle>
        </CardHeader>
        <CardContent>
          {categorySales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">لا توجد فئات بعد</div>
          ) : (
            <div className="space-y-4">
              {categorySales.map((cat: any, i: number) => {
                const pct = categoryTotal > 0 ? (cat.value / categoryTotal) * 100 : 0;
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{cat.value} منتج</span>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
