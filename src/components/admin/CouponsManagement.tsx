import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Ticket, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
}

export const CouponsManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    min_order_amount: 0,
    max_uses: "",
    expires_at: "",
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
  });

  const saveCouponMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const couponData = {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_amount: data.min_order_amount,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        expires_at: data.expires_at || null,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(couponData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingCoupon ? "تم تحديث الكوبون" : "تم إنشاء الكوبون");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleCouponMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الكوبون");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      min_order_amount: 0,
      max_uses: "",
      expires_at: "",
    });
    setEditingCoupon(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_uses: coupon.max_uses?.toString() || "",
      expires_at: coupon.expires_at ? coupon.expires_at.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("تم نسخ الكود");
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">إدارة الكوبونات والخصومات</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="w-4 h-4" />
              كوبون جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "تعديل الكوبون" : "إضافة كوبون جديد"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveCouponMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>كود الكوبون</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="SAVE20"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    توليد
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="خصم 20% على جميع المنتجات"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الخصم</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية %</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>قيمة الخصم</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: parseFloat(e.target.value),
                      })
                    }
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأدنى للطلب</Label>
                  <Input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_order_amount: parseFloat(e.target.value),
                      })
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى للاستخدام</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) =>
                      setFormData({ ...formData, max_uses: e.target.value })
                    }
                    placeholder="غير محدود"
                    min={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saveCouponMutation.isPending}
                >
                  {editingCoupon ? "تحديث" : "إنشاء"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد كوبونات بعد</p>
            </CardContent>
          </Card>
        ) : (
          coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="bg-primary/10 p-3 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => copyCode(coupon.code)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">
                          {coupon.code}
                        </span>
                        <Copy className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}%`
                            : `${coupon.discount_value} د.ج`}
                        </span>
                        {coupon.expires_at && (
                          <Badge variant="outline">
                            ينتهي: {format(new Date(coupon.expires_at), "d MMM yyyy", { locale: ar })}
                          </Badge>
                        )}
                        {!coupon.is_active && (
                          <Badge variant="secondary">معطل</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {coupon.description || "بدون وصف"} • 
                        استخدم {coupon.used_count} مرة
                        {coupon.max_uses && ` من ${coupon.max_uses}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={(checked) =>
                        toggleCouponMutation.mutate({ id: coupon.id, is_active: checked })
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(coupon)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteCouponMutation.mutate(coupon.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
