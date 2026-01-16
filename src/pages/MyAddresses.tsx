import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const wilayas = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة",
  "بشار", "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت",
  "تيزي وزو", "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة",
  "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم",
  "المسيلة", "معسكر", "ورقلة", "وهران", "البيض", "إليزي", "برج بوعريريج",
  "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة", "سوق أهراس",
  "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية",
  "غليزان", "تميمون", "برج باجي مختار", "أولاد جلال", "بني عباس",
  "عين صالح", "عين قزام", "توقرت", "جانت", "المغير", "المنيعة"
];

interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  wilaya: string;
  city: string;
  address: string;
  is_default: boolean;
}

export default function MyAddresses() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    label: "home",
    name: "",
    phone: "",
    wilaya: "",
    city: "",
    address: "",
    is_default: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    // For now, we'll use profile data as the main address
    // In a full implementation, you'd have a separate addresses table
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    if (profile && profile.address) {
      setAddresses([
        {
          id: "main",
          label: "home",
          name: profile.full_name || "",
          phone: profile.phone || "",
          wilaya: profile.wilaya || "",
          city: profile.city || "",
          address: profile.address || "",
          is_default: true,
        },
      ]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      label: "home",
      name: "",
      phone: "",
      wilaya: "",
      city: "",
      address: "",
      is_default: false,
    });
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      name: address.name,
      phone: address.phone,
      wilaya: address.wilaya,
      city: address.city,
      address: address.address,
      is_default: address.is_default,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.wilaya || !formData.address) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      // Update profile with address info
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.name,
          phone: formData.phone,
          wilaya: formData.wilaya,
          city: formData.city,
          address: formData.address,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success(editingAddress ? "تم تحديث العنوان" : "تم إضافة العنوان");
      setShowForm(false);
      resetForm();
      fetchAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("حدث خطأ أثناء الحفظ");
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 pb-20" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b pt-safe">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold truncate">عناوين التوصيل</h1>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)} className="flex-shrink-0">
              <Plus className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">إضافة عنوان</span>
              <span className="sm:hidden">إضافة</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 pt-safe">
        {addresses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-8 text-center shadow-card"
          >
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">لا توجد عناوين محفوظة</h2>
            <p className="text-muted-foreground mb-4">
              أضف عنوان توصيل لتسهيل عملية الشراء
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عنوان جديد
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {address.label === "home" ? (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <Building className="h-5 w-5 text-accent" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {address.label === "home" ? "المنزل" : "العمل"}
                        </span>
                        {address.is_default && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            الافتراضي
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{address.name}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground space-y-1 mr-12">
                  <p>{address.address}</p>
                  <p>
                    {address.city && `${address.city}، `}
                    {address.wilaya}
                  </p>
                  <p className="text-foreground font-medium">{address.phone}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Address Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "تعديل العنوان" : "إضافة عنوان جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={formData.label === "home" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setFormData({ ...formData, label: "home" })}
              >
                <Home className="h-4 w-4 ml-2" />
                المنزل
              </Button>
              <Button
                variant={formData.label === "work" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setFormData({ ...formData, label: "work" })}
              >
                <Building className="h-4 w-4 ml-2" />
                العمل
              </Button>
            </div>

            <div>
              <Label>الاسم الكامل *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل الاسم الكامل"
              />
            </div>

            <div>
              <Label>رقم الهاتف *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0555123456"
                dir="ltr"
              />
            </div>

            <div>
              <Label>الولاية *</Label>
              <Select
                value={formData.wilaya}
                onValueChange={(value) => setFormData({ ...formData, wilaya: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الولاية" />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((wilaya) => (
                    <SelectItem key={wilaya} value={wilaya}>
                      {wilaya}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>المدينة / البلدية</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="أدخل المدينة"
              />
            </div>

            <div>
              <Label>العنوان التفصيلي *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="الشارع، الحي، رقم العمارة..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ العنوان"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
