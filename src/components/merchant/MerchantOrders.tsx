import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Package, Eye, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  shipping_name: string;
  shipping_wilaya: string;
  shipping_city: string;
  shipping_phone: string;
  created_at: string;
  order_items: OrderItem[];
}

export function MerchantOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    // For merchants, we need to get orders that contain their products
    // This is a simplified version - in production you'd filter by merchant_id
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    pending: { label: "قيد الانتظار", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "مؤكد", icon: CheckCircle, color: "bg-blue-100 text-blue-700" },
    processing: { label: "قيد التجهيز", icon: Package, color: "bg-purple-100 text-purple-700" },
    shipped: { label: "تم الشحن", icon: Truck, color: "bg-orange-100 text-orange-700" },
    delivered: { label: "تم التسليم", icon: CheckCircle, color: "bg-primary/10 text-primary" },
    cancelled: { label: "ملغي", icon: XCircle, color: "bg-red-100 text-red-700" },
  };

  const filters = [
    { id: "all", label: "الكل" },
    { id: "pending", label: "قيد الانتظار" },
    { id: "confirmed", label: "مؤكد" },
    { id: "processing", label: "قيد التجهيز" },
    { id: "shipped", label: "تم الشحن" },
    { id: "delivered", label: "تم التسليم" },
  ];

  const filteredOrders = activeFilter === "all" 
    ? orders 
    : orders.filter(o => o.status === activeFilter);

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === "pending").length}
          </p>
          <p className="text-xs text-muted-foreground">قيد الانتظار</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter(o => ["confirmed", "processing", "shipped"].includes(o.status)).length}
          </p>
          <p className="text-xs text-muted-foreground">قيد المعالجة</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-primary">
            {orders.filter(o => o.status === "delivered").length}
          </p>
          <p className="text-xs text-muted-foreground">تم التسليم</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter.id)}
            className="flex-shrink-0"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center shadow-card">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = statusInfo.icon;
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-bold text-lg">#{order.order_number}</span>
                    <div className={`inline-flex items-center gap-1 mr-2 px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">{order.total.toLocaleString()} دج</span>
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  <p>📦 {order.order_items?.length || 0} منتجات</p>
                  <p>📍 {order.shipping_name} - {order.shipping_wilaya}, {order.shipping_city}</p>
                  <p>📞 {order.shipping_phone}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("ar-DZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4 ml-1" />
                    التفاصيل
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-elevated"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">طلب #{selectedOrder.order_number}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                ✕
              </Button>
            </div>

            {/* Order Status */}
            <div className={`rounded-xl p-3 mb-4 ${statusConfig[selectedOrder.status]?.color}`}>
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = statusConfig[selectedOrder.status]?.icon || Clock;
                  return <Icon className="h-5 w-5" />;
                })()}
                <span className="font-medium">{statusConfig[selectedOrder.status]?.label}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-secondary rounded-xl p-4 mb-4">
              <h4 className="font-medium mb-2">معلومات العميل</h4>
              <p>{selectedOrder.shipping_name}</p>
              <p className="text-sm text-muted-foreground">{selectedOrder.shipping_phone}</p>
              <p className="text-sm text-muted-foreground">
                {selectedOrder.shipping_wilaya}, {selectedOrder.shipping_city}
              </p>
            </div>

            {/* Order Items */}
            <div className="bg-secondary rounded-xl p-4 mb-4">
              <h4 className="font-medium mb-3">المنتجات</h4>
              <div className="space-y-3">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.product_image || "/placeholder.svg"}
                      alt={item.product_name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {item.unit_price.toLocaleString()} دج
                      </p>
                    </div>
                    <span className="font-bold">{item.total_price.toLocaleString()} دج</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between font-bold text-lg">
              <span>المجموع الكلي</span>
              <span className="text-primary">{selectedOrder.total.toLocaleString()} دج</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
