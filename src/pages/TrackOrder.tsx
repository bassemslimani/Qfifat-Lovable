import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import OrderTrackingMap from "@/components/tracking/OrderTrackingMap";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function TrackOrder() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price,
            product_image
          )
        `)
        .or(`id.eq.${id},order_number.eq.${id},tracking_number.eq.${id}`)
        .single();

      if (fetchError) {
        setError("لم يتم العثور على الطلب");
      } else {
        setOrder(data);
      }
    } catch (err) {
      setError("حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/track/${searchQuery.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>

          <h1 className="text-2xl font-bold mb-6">تتبع الشحنة</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="أدخل رقم الطلب أو رقم التتبع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button type="submit" disabled={!searchQuery.trim()}>
                بحث
              </Button>
            </div>
          </form>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري البحث...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-destructive/10 text-destructive rounded-2xl p-6 text-center"
            >
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-2">تأكد من صحة رقم الطلب أو رقم التتبع</p>
            </motion.div>
          )}

          {/* Order Found */}
          {order && !loading && (
            <div className="space-y-6">
              {/* Order Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-6 shadow-card"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-lg">طلب #{order.order_number}</h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("ar-DZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === "delivered"
                        ? "bg-primary/10 text-primary"
                        : order.status === "shipped"
                        ? "bg-blue-100 text-blue-700"
                        : order.status === "cancelled"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status === "pending"
                      ? "قيد الانتظار"
                      : order.status === "confirmed"
                      ? "تم التأكيد"
                      : order.status === "processing"
                      ? "جاري التجهيز"
                      : order.status === "shipped"
                      ? "تم الشحن"
                      : order.status === "delivered"
                      ? "تم التسليم"
                      : order.status === "cancelled"
                      ? "ملغي"
                      : order.status}
                  </span>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-medium mb-3">عنوان التوصيل</h3>
                  <p className="text-muted-foreground">
                    {order.shipping_name}
                    <br />
                    {order.shipping_address}
                    <br />
                    {order.shipping_city}، {order.shipping_wilaya}
                    <br />
                    {order.shipping_phone}
                  </p>
                </div>

                {order.estimated_delivery && (
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      التسليم المتوقع:{" "}
                      <span className="font-medium text-foreground">
                        {new Date(order.estimated_delivery).toLocaleDateString("ar-DZ")}
                      </span>
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-card"
              >
                <h3 className="font-bold mb-4">المنتجات</h3>
                <div className="space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-secondary/30"
                    >
                      <img
                        src={item.product_image || "/placeholder.svg"}
                        alt={item.product_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × {item.unit_price} دج
                        </p>
                      </div>
                      <p className="font-bold">{item.total_price} دج</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span>{order.subtotal} دج</span>
                  </div>
                  {order.shipping_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الشحن</span>
                      <span>{order.shipping_cost} دج</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-primary">{order.total} دج</span>
                  </div>
                </div>
              </motion.div>

              {/* Tracking Map */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <OrderTrackingMap
                  orderId={order.id}
                  trackingNumber={order.tracking_number}
                />
              </motion.div>
            </div>
          )}

          {/* No Search Yet */}
          {!orderId && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl p-8 text-center shadow-card"
            >
              <Package className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
              <h2 className="font-bold text-lg mb-2">تتبع طلبك</h2>
              <p className="text-muted-foreground mb-4">
                أدخل رقم الطلب أو رقم التتبع في الأعلى لمتابعة شحنتك
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
