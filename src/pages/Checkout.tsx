import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Building2, Upload, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type PaymentMethod = "barid" | "stripe";

const wilayas = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار",
  "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر",
  "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة",
  "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة", "وهران", "البيض",
  "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي",
  "خنشلة", "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت",
  "غرداية", "غليزان", "تيميمون", "برج باجي مختار", "أولاد جلال", "بني عباس",
  "عين صالح", "عين قزام", "تقرت", "جانت", "المغير", "المنيعة"
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  
  const [step, setStep] = useState<"shipping" | "payment" | "confirm">("shipping");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("barid");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    wilaya: "",
  });

  const [baridInfo, setBaridInfo] = useState({
    accountHolder: "قفيفات للحرف اليدوية",
    ccpNumber: "0023456789",
    ccpKey: "45",
  });

  const shippingCost = 500; // Fixed shipping cost

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (paymentMethod === "barid" && !uploadedFile) {
      toast({
        title: "خطأ",
        description: "يرجى رفع وثيقة إثبات التحويل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_id: user.id,
          order_number: `QF-${Date.now()}`,
          subtotal: total,
          shipping_cost: shippingCost,
          total: total + shippingCost,
          shipping_name: shippingInfo.name,
          shipping_phone: shippingInfo.phone,
          shipping_address: shippingInfo.address,
          shipping_city: shippingInfo.city,
          shipping_wilaya: shippingInfo.wilaya,
        }] as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          method: paymentMethod,
          amount: total + shippingCost,
          status: paymentMethod === "stripe" ? "verified" : "pending",
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Upload payment proof for Barid
      if (paymentMethod === "barid" && uploadedFile) {
        const fileExt = uploadedFile.name.split(".").pop();
        const filePath = `${user.id}/${payment.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-proofs")
          .upload(filePath, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("payment-proofs")
          .getPublicUrl(filePath);

        await supabase
          .from("payment_proofs")
          .insert({
            payment_id: payment.id,
            file_url: publicUrl,
            file_name: uploadedFile.name,
            uploaded_by: user.id,
          });
      }

      clearCart();
      setStep("confirm");
      
      toast({
        title: "تم إنشاء الطلب بنجاح!",
        description: `رقم الطلب: ${order.order_number}`,
      });
    } catch (error: any) {
      console.error("Order error:", error);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-10 w-10 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تم إرسال طلبك بنجاح!</h1>
          <p className="text-muted-foreground mb-6">
            {paymentMethod === "barid" 
              ? "سيتم مراجعة إثبات الدفع والتواصل معك قريباً"
              : "تم تأكيد الدفع وسيتم شحن طلبك قريباً"}
          </p>
          <Button onClick={() => navigate("/")} variant="hero">
            العودة للتسوق
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />
      <main className="container py-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === "shipping" ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
          }`}>1</div>
          <div className="w-12 h-1 bg-border" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === "payment" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>2</div>
        </div>

        {step === "shipping" && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleShippingSubmit}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold text-foreground">معلومات التوصيل</h2>
            
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-4">
              <div>
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  value={shippingInfo.name}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <Label htmlFor="wilaya">الولاية</Label>
                <select
                  id="wilaya"
                  value={shippingInfo.wilaya}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, wilaya: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background"
                  required
                >
                  <option value="">اختر الولاية</option>
                  {wilayas.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="city">البلدية</Label>
                <Input
                  id="city"
                  value={shippingInfo.city}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  placeholder="الشارع، الحي، رقم المنزل..."
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full">
              متابعة للدفع
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </motion.form>
        )}

        {step === "payment" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">طريقة الدفع</h2>
              <button 
                onClick={() => setStep("shipping")}
                className="text-sm text-primary"
              >
                تعديل العنوان
              </button>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod("barid")}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === "barid"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <span className="font-medium text-foreground">بريد الجزائر</span>
              </button>
              <button
                onClick={() => setPaymentMethod("stripe")}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === "stripe"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <CreditCard className="h-8 w-8 text-primary mx-auto mb-2" />
                <span className="font-medium text-foreground">بطاقة بنكية</span>
              </button>
            </div>

            {/* Barid Payment Info */}
            {paymentMethod === "barid" && (
              <div className="bg-card rounded-2xl p-4 shadow-card space-y-4">
                <h3 className="font-bold text-foreground">معلومات التحويل</h3>
                <div className="bg-secondary rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم صاحب الحساب</span>
                    <span className="font-medium">{baridInfo.accountHolder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم CCP</span>
                    <span className="font-mono font-bold" dir="ltr">{baridInfo.ccpNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المفتاح</span>
                    <span className="font-mono font-bold" dir="ltr">{baridInfo.ccpKey}</span>
                  </div>
                </div>

                <div>
                  <Label>رفع وثيقة إثبات التحويل *</Label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {uploadedFile ? uploadedFile.name : "اضغط لرفع صورة الوصل"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <h3 className="font-bold text-foreground mb-3">ملخص الطلب</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المنتجات ({items.length})</span>
                  <span>{total.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التوصيل</span>
                  <span>{shippingCost.toLocaleString()} دج</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span className="text-primary">{(total + shippingCost).toLocaleString()} دج</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  تأكيد الطلب
                  <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
