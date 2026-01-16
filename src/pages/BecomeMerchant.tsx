import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Store, ArrowLeft, CheckCircle, Clock, AlertCircle, 
  Phone, MapPin, FileText, Loader2, XCircle, HourglassIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const wilayas = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار",
  "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر",
  "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة",
  "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة", "وهران"
];

type RequestStatus = "pending" | "approved" | "rejected" | null;

export default function BecomeMerchant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);
  const [existingRequest, setExistingRequest] = useState<{
    status: RequestStatus;
    businessName: string;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    phone: "",
    wilaya: "",
  });

  // Check if user already has a merchant request
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!user) {
        setCheckingRequest(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("merchant_requests")
          .select("status, business_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          setExistingRequest({
            status: data.status as RequestStatus,
            businessName: data.business_name,
          });
        }
      } catch (error) {
        // No existing request
      } finally {
        setCheckingRequest(false);
      }
    };

    checkExistingRequest();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "يرجى تسجيل الدخول أولاً",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("merchant_requests")
        .insert([{
          user_id: user.id,
          business_name: formData.businessName,
          business_description: formData.businessDescription,
          phone: formData.phone,
          wilaya: formData.wilaya,
          status: "pending",
        }] as any);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "تم إرسال طلبك بنجاح!",
        description: "سيتم مراجعة طلبك والرد عليك قريباً",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checkingRequest) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  // Show existing request status
  if (existingRequest) {
    const isPending = existingRequest.status === "pending";
    const isApproved = existingRequest.status === "approved";
    const isRejected = existingRequest.status === "rejected";

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isPending ? "bg-warning/10" : isApproved ? "bg-primary/10" : "bg-destructive/10"
            }`}
          >
            {isPending && <HourglassIcon className="h-10 w-10 text-warning" />}
            {isApproved && <CheckCircle className="h-10 w-10 text-primary" />}
            {isRejected && <XCircle className="h-10 w-10 text-destructive" />}
          </motion.div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isPending && "طلبك قيد المراجعة"}
            {isApproved && "تم قبول طلبك!"}
            {isRejected && "تم رفض طلبك"}
          </h1>
          
          <p className="text-muted-foreground mb-2">
            <span className="font-semibold">{existingRequest.businessName}</span>
          </p>
          
          <p className="text-muted-foreground mb-6">
            {isPending && "لديك طلب معلق لدى الإدارة، سيتم مراجعته والتواصل معك قريباً"}
            {isApproved && "يمكنك الآن الوصول إلى لوحة تحكم البائع"}
            {isRejected && "للأسف تم رفض طلبك، يمكنك التواصل معنا لمعرفة المزيد"}
          </p>
          
          {isApproved ? (
            <Button onClick={() => navigate("/merchant")} variant="hero">
              الذهاب للوحة التحكم
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => navigate("/")} variant="outline">
              العودة للرئيسية
            </Button>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 pb-20">
      <Header />
      
      <main className="container py-6 pt-safe">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground mb-6"
        >
          <Store className="h-12 w-12 mb-4" />
          <h1 className="text-2xl font-bold mb-2">انضم كبائع</h1>
          <p className="text-primary-foreground/80">
            ابدأ ببيع منتجاتك الحرفية على منصة قفيفات واصل لآلاف العملاء
          </p>
        </motion.div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl p-3 text-center shadow-card">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">متجرك الخاص</span>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-card">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">دعم متواصل</span>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-card">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">بدون رسوم</span>
          </div>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl p-6 shadow-card space-y-4"
        >
          <h2 className="font-bold text-foreground mb-4">معلومات النشاط التجاري</h2>
          
          <div>
            <Label htmlFor="businessName">اسم النشاط التجاري</Label>
            <div className="relative mt-1.5">
              <Store className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="مثال: حرف يدوية الجزائر"
                className="pr-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessDescription">وصف النشاط</Label>
            <textarea
              id="businessDescription"
              value={formData.businessDescription}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              placeholder="صف نشاطك التجاري والمنتجات التي تقدمها..."
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-border bg-background resize-none h-24"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0555123456"
                className="pr-10"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="wilaya">الولاية</Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                id="wilaya"
                value={formData.wilaya}
                onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                className="w-full h-11 pr-10 pl-4 rounded-xl border border-border bg-background"
                required
              >
                <option value="">اختر الولاية</option>
                {wilayas.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                إرسال الطلب
                <ArrowLeft className="h-4 w-4" />
              </>
            )}
          </Button>
        </motion.form>
      </main>

      <BottomNav />
    </div>
  );
}
