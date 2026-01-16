import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Plus,
  Navigation,
  Clock,
  CheckCircle,
  Truck,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TrackingManagerProps {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  onUpdate?: () => void;
}

const statusOptions = [
  { value: "pending", label: "قيد الانتظار", icon: Clock },
  { value: "confirmed", label: "تم التأكيد", icon: Package },
  { value: "processing", label: "جاري التجهيز", icon: Package },
  { value: "shipped", label: "تم الشحن", icon: Truck },
  { value: "delivered", label: "تم التسليم", icon: CheckCircle },
];

// Algerian cities with coordinates
const algerianCities = [
  { name: "الجزائر العاصمة", lat: 36.7538, lng: 3.0588 },
  { name: "وهران", lat: 35.6969, lng: -0.6331 },
  { name: "قسنطينة", lat: 36.365, lng: 6.6147 },
  { name: "عنابة", lat: 36.9, lng: 7.7667 },
  { name: "سطيف", lat: 36.19, lng: 5.4117 },
  { name: "باتنة", lat: 35.555, lng: 6.1744 },
  { name: "تلمسان", lat: 34.8828, lng: -1.3167 },
  { name: "بجاية", lat: 36.7508, lng: 5.0567 },
  { name: "البليدة", lat: 36.47, lng: 2.8283 },
  { name: "تيزي وزو", lat: 36.7117, lng: 4.0456 },
];

export default function TrackingManager({
  orderId,
  orderNumber,
  currentStatus,
  onUpdate,
}: TrackingManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    location: "",
    description: "",
    trackingNumber: "",
    estimatedDelivery: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.status || !formData.location) {
      toast({
        title: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Find city coordinates
      const city = algerianCities.find((c) => c.name === formData.location);

      // Add tracking entry
      const { error: trackingError } = await supabase
        .from("shipping_tracking")
        .insert({
          order_id: orderId,
          status: formData.status,
          location: formData.location,
          latitude: city?.lat || null,
          longitude: city?.lng || null,
          description: formData.description,
        });

      if (trackingError) throw trackingError;

      // Update order status and tracking info
      const updateData: any = {
        status: formData.status,
        current_location: formData.location,
      };

      if (city) {
        updateData.latitude = city.lat;
        updateData.longitude = city.lng;
      }

      if (formData.trackingNumber) {
        updateData.tracking_number = formData.trackingNumber;
      }

      if (formData.estimatedDelivery) {
        updateData.estimated_delivery = formData.estimatedDelivery;
      }

      const { error: orderError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (orderError) throw orderError;

      toast({ title: "تم تحديث حالة الشحن بنجاح" });
      setOpen(false);
      setFormData({
        status: "",
        location: "",
        description: "",
        trackingNumber: "",
        estimatedDelivery: "",
      });
      onUpdate?.();
    } catch (error: any) {
      console.error("Error updating tracking:", error);
      toast({
        title: "خطأ في تحديث التتبع",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Navigation className="h-4 w-4 ml-2" />
          تحديث التتبع
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تحديث تتبع الطلب #{orderNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              حالة الشحن *
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">الموقع *</label>
            <Select
              value={formData.location}
              onValueChange={(value) =>
                setFormData({ ...formData, location: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الموقع" />
              </SelectTrigger>
              <SelectContent>
                {algerianCities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {city.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              رقم التتبع (اختياري)
            </label>
            <Input
              type="text"
              placeholder="أدخل رقم التتبع"
              value={formData.trackingNumber}
              onChange={(e) =>
                setFormData({ ...formData, trackingNumber: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              تاريخ التسليم المتوقع (اختياري)
            </label>
            <Input
              type="date"
              value={formData.estimatedDelivery}
              onChange={(e) =>
                setFormData({ ...formData, estimatedDelivery: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              ملاحظات (اختياري)
            </label>
            <Textarea
              placeholder="أضف ملاحظات حول حالة الشحن..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "جاري الحفظ..." : "حفظ التحديث"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
