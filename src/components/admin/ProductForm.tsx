import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Upload, Loader2, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  product?: any;
  onClose: () => void;
  onSave: () => void;
}

export function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    original_price: product?.original_price || "",
    category_id: product?.category_id || "",
    stock_quantity: product?.stock_quantity || 0,
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    image_url: product?.image_url || "",
    images: product?.images || [],
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order");
    
    if (data) setCategories(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean = true) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "يرجى اختيار صورة صالحة", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      if (isMain) {
        setFormData({ ...formData, image_url: urlData.publicUrl });
      } else {
        setFormData({ ...formData, images: [...formData.images, urlData.publicUrl] });
      }

      toast({ title: "تم رفع الصورة بنجاح!" });
    } catch (error: any) {
      toast({ title: "خطأ في رفع الصورة", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = formData.images.filter((_: string, i: number) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id || null,
        stock_quantity: parseInt(formData.stock_quantity.toString()) || 0,
        in_stock: parseInt(formData.stock_quantity.toString()) > 0,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        image_url: formData.image_url,
        images: formData.images,
      };

      if (product?.id) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);
        
        if (error) throw error;
        toast({ title: "تم تحديث المنتج بنجاح!" });
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);
        
        if (error) throw error;
        toast({ title: "تم إضافة المنتج بنجاح!" });
      }

      onSave();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">
            {product ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Main Image */}
          <div>
            <Label>الصورة الرئيسية</Label>
            <div className="mt-2 flex items-center gap-4">
              {formData.image_url ? (
                <div className="relative w-24 h-24">
                  <img
                    src={formData.image_url}
                    alt="Main"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                    className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">رفع صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
              {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>
          </div>

          {/* Gallery Images */}
          <div>
            <Label>معرض الصور (اختياري)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.images.map((img: string, index: number) => (
                <div key={index} className="relative w-16 h-16">
                  <img
                    src={img}
                    alt={`Gallery ${index}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute -top-1 -left-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">اسم المنتج</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: سلة يدوية تقليدية"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="price">السعر (دج)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="2500"
                required
                className="mt-1.5"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="original_price">السعر الأصلي (اختياري)</Label>
              <Input
                id="original_price"
                type="number"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                placeholder="3000"
                className="mt-1.5"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="category">الفئة</Label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full mt-1.5 h-10 px-3 rounded-xl border border-border bg-background"
              >
                <option value="">اختر الفئة</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="stock">الكمية المتوفرة</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                placeholder="10"
                className="mt-1.5"
                dir="ltr"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">الوصف</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف تفصيلي للمنتج..."
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-border bg-background h-24 resize-none"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">منتج نشط</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">منتج مميز</span>
            </label>
          </div>
        </form>

        <div className="flex gap-3 p-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.price}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : product ? (
              "حفظ التغييرات"
            ) : (
              "إضافة المنتج"
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
