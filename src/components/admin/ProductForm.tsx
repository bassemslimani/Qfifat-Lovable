import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Upload, Loader2, ImagePlus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
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

interface ValidationError {
  field: string;
  message: string;
}

export function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const [formData, setFormData] = useState(() => {
    // Combine main image and gallery into single images array
    const existingImages: string[] = [];
    if (product?.image_url) existingImages.push(product.image_url);
    if (product?.images?.length) {
      product.images.forEach((img: string) => {
        if (img && !existingImages.includes(img)) existingImages.push(img);
      });
    }
    return {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || "",
      original_price: product?.original_price || "",
      category_id: product?.category_id || "",
      stock_quantity: product?.stock_quantity || 0,
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
      images: existingImages,
    };
  });

  // Validation function
  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Name validation
    if (!formData.name.trim()) {
      errors.push({ field: "name", message: "اسم المنتج مطلوب" });
    } else if (formData.name.trim().length < 3) {
      errors.push({ field: "name", message: "يجب أن يكون اسم المنتج 3 أحرف على الأقل" });
    } else if (formData.name.trim().length > 100) {
      errors.push({ field: "name", message: "يجب ألا يتجاوز اسم المنتج 100 حرف" });
    }

    // Price validation
    if (!formData.price) {
      errors.push({ field: "price", message: "سعر المنتج مطلوب" });
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        errors.push({ field: "price", message: "يرجى إدخال سعر صحيح أكبر من صفر" });
      } else if (priceNum > 10000000) {
        errors.push({ field: "price", message: "السعر مرتفع جداً، يرجى التحقق" });
      }
    }

    // Original price validation (optional but must be valid if provided)
    if (formData.original_price) {
      const originalPriceNum = parseFloat(formData.original_price);
      const priceNum = parseFloat(formData.price) || 0;
      if (isNaN(originalPriceNum) || originalPriceNum <= 0) {
        errors.push({ field: "original_price", message: "يرجى إدخال سعر أصلي صحيح" });
      } else if (originalPriceNum <= priceNum) {
        errors.push({ field: "original_price", message: "السعر الأصلي يجب أن يكون أعلى من السعر الحالي" });
      }
    }

    // Stock quantity validation
    const stockNum = parseInt(formData.stock_quantity.toString());
    if (isNaN(stockNum) || stockNum < 0) {
      errors.push({ field: "stock_quantity", message: "يرجى إدخال كمية صحيحة" });
    } else if (stockNum > 100000) {
      errors.push({ field: "stock_quantity", message: "الكمية كبيرة جداً، يرجى التحقق" });
    }

    // Description validation (optional but limited)
    if (formData.description && formData.description.length > 2000) {
      errors.push({ field: "description", message: "الوصف طويل جداً (الحد الأقصى 2000 حرف)" });
    }

    // Image validation - first image in array is main image
    if (!formData.images || formData.images.length === 0) {
      errors.push({ field: "images", message: "يجب إضافة صورة واحدة على الأقل للمنتج" });
    }

    return errors;
  };

  // Get error for specific field
  const getFieldError = (field: string): string | undefined => {
    if (!touched[field]) return undefined;
    const error = validationErrors.find(e => e.field === field);
    return error?.message;
  };

  // Handle field blur (mark as touched)
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setValidationErrors(validateForm());
  };

  // Check if form is valid
  const isFormValid = () => {
    const errors = validateForm();
    return errors.length === 0;
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate all files are images
    const validFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (validFiles.length === 0) {
      toast({ title: "يرجى اختيار صور صالحة", variant: "destructive" });
      return;
    }

    if (validFiles.length !== files.length) {
      toast({ title: `تم تجاهل ${files.length - validFiles.length} ملفات غير صالحة`, variant: "default" });
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of validFiles) {
        const fileExt = file.name.split(".").pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        // Read file as ArrayBuffer and upload as raw binary (not FormData)
        // This ensures the PHP proxy receives the data correctly
        const arrayBuffer = await file.arrayBuffer();

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("products")
          .upload(fileName, arrayBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        console.log("Upload success:", uploadData);

        const { data: urlData } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Add all uploaded images to the array
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));

      toast({ title: `تم رفع ${uploadedUrls.length} صورة بنجاح!` });
    } catch (error: any) {
      console.error("Full upload error:", error);
      toast({
        title: "خطأ في رفع الصورة",
        description: error?.message || error?.error || "حدث خطأ غير معروف",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset input to allow selecting same files again
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_: string, i: number) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const setAsMainImage = (index: number) => {
    if (index === 0) return; // Already main
    const newImages = [...formData.images];
    const [removed] = newImages.splice(index, 1);
    newImages.unshift(removed);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      price: true,
      original_price: true,
      stock_quantity: true,
      description: true,
      images: true,
      category_id: true,
    });

    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast({
        title: "يرجى مراجعة البيانات المدخلة",
        description: "هناك بعض الحقول تحتاج إلى تصحيح",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // First image is main, rest are gallery
      const mainImage = formData.images[0] || "";
      const galleryImages = formData.images.slice(1);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price) || 0,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id || null,
        stock_quantity: parseInt(formData.stock_quantity.toString()) || 0,
        in_stock: parseInt(formData.stock_quantity.toString()) > 0,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        image_url: mainImage,
        images: galleryImages,
      };

      if (product?.id) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);

        if (error) {
          // Handle specific errors
          if (error.code === '23505') {
            throw new Error("يوجد منتج بنفس الاسم بالفعل");
          } else if (error.code === '23503') {
            throw new Error("الفئة المختارة غير موجودة");
          } else if (error.code === '42501') {
            throw new Error("ليس لديك صلاحية لتعديل المنتجات");
          }
          throw error;
        }
        toast({
          title: "تم تحديث المنتج بنجاح!",
          description: `تم حفظ التغييرات على "${formData.name}"`,
        });
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);

        if (error) {
          // Handle specific errors
          if (error.code === '23505') {
            throw new Error("يوجد منتج بنفس الاسم بالفعل");
          } else if (error.code === '23503') {
            throw new Error("الفئة المختارة غير موجودة");
          } else if (error.code === '42501') {
            throw new Error("ليس لديك صلاحية لإضافة المنتجات");
          } else if (error.code === '23502') {
            throw new Error("يرجى ملء جميع الحقول المطلوبة");
          }
          throw error;
        }
        toast({
          title: "تم إضافة المنتج بنجاح!",
          description: `تمت إضافة "${formData.name}" إلى قائمة المنتجات`,
        });
      }

      onSave();
    } catch (error: any) {
      console.error("Product save error:", error);
      toast({
        title: "فشل في حفظ المنتج",
        description: error.message || "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-t-2xl sm:rounded-2xl shadow-elevated w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col sm:m-4"
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold">
            {product ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Product Images - First image is main */}
          <div>
            <Label className="flex items-center gap-1">
              صور المنتج
              <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">الصورة الأولى ستكون الصورة الرئيسية للمنتج</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {formData.images.map((img: string, index: number) => (
                <div key={index} className={`relative w-20 h-20 ${index === 0 ? 'ring-2 ring-primary ring-offset-2 rounded-xl' : ''}`}>
                  <img
                    src={img}
                    alt={`صورة ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {index === 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => setAsMainImage(index)}
                      className="absolute -bottom-1 -right-1 bg-muted text-muted-foreground rounded-full p-0.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                      title="تعيين كصورة رئيسية"
                    >
                      <ImagePlus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <label className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                getFieldError("images") ? "border-destructive bg-destructive/5" : "border-border hover:border-primary"
              }`}>
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className={`h-6 w-6 ${getFieldError("images") ? "text-destructive" : "text-muted-foreground"}`} />
                    <span className={`text-xs mt-1 ${getFieldError("images") ? "text-destructive" : "text-muted-foreground"}`}>إضافة</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {getFieldError("images") && (
              <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError("images")}
              </p>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                اسم المنتج
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => handleBlur("name")}
                placeholder="مثال: سلة يدوية تقليدية"
                className={`mt-1.5 ${getFieldError("name") ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {getFieldError("name") && (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("name")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="price" className="flex items-center gap-1">
                السعر (دج)
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                onBlur={() => handleBlur("price")}
                placeholder="2500"
                className={`mt-1.5 ${getFieldError("price") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                dir="ltr"
              />
              {getFieldError("price") && (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("price")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="original_price">السعر الأصلي (اختياري - للتخفيضات)</Label>
              <Input
                id="original_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                onBlur={() => handleBlur("original_price")}
                placeholder="3000"
                className={`mt-1.5 ${getFieldError("original_price") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                dir="ltr"
              />
              {getFieldError("original_price") ? (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("original_price")}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">أدخل السعر قبل الخصم لعرض نسبة التخفيض</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">الفئة</Label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full mt-1.5 h-10 px-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">اختر الفئة (اختياري)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">اختر فئة لتسهيل العثور على المنتج</p>
            </div>

            <div>
              <Label htmlFor="stock">الكمية المتوفرة</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                onBlur={() => handleBlur("stock_quantity")}
                placeholder="10"
                className={`mt-1.5 ${getFieldError("stock_quantity") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                dir="ltr"
              />
              {getFieldError("stock_quantity") ? (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("stock_quantity")}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  {parseInt(formData.stock_quantity.toString()) === 0 ? "سيظهر المنتج كـ \"نفذت الكمية\"" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">الوصف</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onBlur={() => handleBlur("description")}
              placeholder="وصف تفصيلي للمنتج... (مثال: سلة يدوية مصنوعة من ألياف النخيل الطبيعية)"
              className={`w-full mt-1.5 px-4 py-3 rounded-xl border bg-background h-24 resize-none focus:ring-2 focus:ring-primary focus:outline-none ${
                getFieldError("description") ? "border-destructive" : "border-border"
              }`}
            />
            <div className="flex justify-between mt-1">
              {getFieldError("description") ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("description")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">وصف جيد يساعد العملاء على فهم المنتج</p>
              )}
              <span className={`text-xs ${formData.description.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}>
                {formData.description.length}/2000
              </span>
            </div>
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

        {/* Footer - Fixed */}
        <div className="p-4 border-t border-border space-y-3 flex-shrink-0 bg-card pb-safe">
          {/* Validation summary */}
          {Object.keys(touched).length > 0 && validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-destructive/10 border border-destructive/20 rounded-xl p-3"
            >
              <p className="text-sm font-medium text-destructive flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                يرجى تصحيح الأخطاء التالية:
              </p>
              <ul className="text-xs text-destructive/80 space-y-1 pr-6">
                {validationErrors.slice(0, 3).map((error, index) => (
                  <li key={index} className="list-disc">{error.message}</li>
                ))}
                {validationErrors.length > 3 && (
                  <li className="list-disc">و {validationErrors.length - 3} أخطاء أخرى...</li>
                )}
              </ul>
            </motion.div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جارٍ الحفظ...
                </>
              ) : product ? (
                <>
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  حفظ التغييرات
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  إضافة المنتج
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
