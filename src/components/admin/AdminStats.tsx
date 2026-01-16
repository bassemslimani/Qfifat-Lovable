import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const AdminStats = () => {
  // Fetch orders with totals
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

  // Fetch users count
  const { data: usersData } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return { count: count || 0 };
    },
  });

  // Fetch products count
  const { data: productsData } = useQuery({
    queryKey: ["admin-products-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return { count: count || 0 };
    },
  });

  // Fetch categories with product counts
  const { data: categorySales = [] } = useQuery({
    queryKey: ["admin-category-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          products:products(count)
        `);

      if (error) throw error;
      return data.map((cat: any) => ({
        name: cat.name,
        value: cat.products?.[0]?.count || 0,
      }));
    },
  });

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  // Calculate daily sales for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return (
        orderDate >= startOfDay(date) && orderDate <= endOfDay(date)
      );
    });
    return {
      name: format(date, "EEE", { locale: ar }),
      date: format(date, "d MMM", { locale: ar }),
      إيرادات: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      طلبات: dayOrders.length,
    };
  });

  // Order status distribution
  const orderStatusData = [
    { name: "معلق", value: orders.filter((o) => o.status === "pending").length },
    { name: "مؤكد", value: orders.filter((o) => o.status === "confirmed").length },
    { name: "قيد التجهيز", value: orders.filter((o) => o.status === "processing").length },
    { name: "تم الشحن", value: orders.filter((o) => o.status === "shipped").length },
    { name: "تم التوصيل", value: orders.filter((o) => o.status === "delivered").length },
    { name: "ملغي", value: orders.filter((o) => o.status === "cancelled").length },
  ].filter((s) => s.value > 0);

  // Calculate growth (comparing last 7 days to previous 7 days)
  const last7DaysRevenue = last7Days.reduce((sum, d) => sum + d.إيرادات, 0);
  const previous7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 13 - i));
  const previous7DaysRevenue = orders
    .filter((order) => {
      const orderDate = new Date(order.created_at);
      return (
        orderDate >= startOfDay(previous7Days[0]) &&
        orderDate <= endOfDay(previous7Days[6])
      );
    })
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const revenueGrowth =
    previous7DaysRevenue > 0
      ? ((last7DaysRevenue - previous7DaysRevenue) / previous7DaysRevenue) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} د.ج</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {revenueGrowth >= 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">+{revenueGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">{revenueGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">مقارنة بالأسبوع الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <ShoppingCart className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {deliveredOrders} تم توصيلها • {pendingOrders} معلقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المستخدمين</p>
                <p className="text-2xl font-bold">{usersData?.count || 0}</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المنتجات</p>
                <p className="text-2xl font-bold">{productsData?.count || 0}</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
                <Package className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات والطلبات (آخر 7 أيام)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="إيرادات"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع حالات الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>عدد الطلبات اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="طلبات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المنتجات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales.filter((c: any) => c.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categorySales.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
