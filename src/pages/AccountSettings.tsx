import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, User, Phone, MapPin, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

interface ProfileData {
  full_name: string;
  phone: string;
  wilaya: string;
  city: string;
  address: string;
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    phone: "",
    wilaya: "",
    city: "",
    address: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          wilaya: data.wilaya || "",
          city: data.city || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          wilaya: profile.wilaya,
          city: profile.city,
          address: profile.address,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم تحديث بيانات الملف الشخصي بنجاح",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowRight className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold">إعدادات الحساب</h1>
        </div>
      </header>

      <main className="container py-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-hero flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>

          {/* Form */}
          <div className="bg-card rounded-2xl p-6 shadow-card space-y-5">
            <h2 className="font-bold text-foreground mb-4">المعلومات الشخصية</h2>

            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="pr-10"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="pr-10"
                  placeholder="0XXX XXX XXX"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wilaya">الولاية</Label>
              <Select
                value={profile.wilaya}
                onValueChange={(value) => setProfile({ ...profile, wilaya: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الولاية" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {wilayas.map((wilaya) => (
                    <SelectItem key={wilaya} value={wilaya}>
                      {wilaya}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">المدينة / البلدية</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                placeholder="أدخل اسم المدينة أو البلدية"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">العنوان الكامل</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="pr-10"
                  placeholder="أدخل عنوانك الكامل"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 text-base"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 ml-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
