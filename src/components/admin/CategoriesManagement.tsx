import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3X3, Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast({ title: "تم تحديث الفئة بنجاح" });
      } else {
        const { error } = await supabase
          .from("categories")
          .insert([{
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          }]);

        if (error) throw error;
        toast({ title: "تم إضافة الفئة بنجاح" });
      }

      setShowForm(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      sort_order: category.sort_order || 0,
      is_active: category.is_active ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفئة؟")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    
    if (error) {
      toast({ title: "خطأ في الحذف", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم حذف الفئة" });
      fetchCategories();
    }
  };

  const handleToggle = async (category: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !category.is_active })
      .eq("id", category.id);

    if (!error) fetchCategories();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      sort_order: 0,
      is_active: true,
    });
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">إدارة الفئات ({categories.length})</h3>
        <Button onClick={() => { resetForm(); setEditingCategory(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة فئة
        </Button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center shadow-card">
          <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد فئات بعد</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 ml-2" />
            أضف أول فئة
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-card rounded-2xl p-4 shadow-card border-2 transition-colors ${
                category.is_active ? "border-transparent" : "border-muted opacity-60"
              }`}
            >
              <div className="text-center mb-3">
                <span className="text-4xl">{category.icon || "📦"}</span>
              </div>
              <h4 className="font-bold text-center mb-1">{category.name}</h4>
              {category.description && (
                <p className="text-xs text-muted-foreground text-center line-clamp-2">
                  {category.description}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(category)}
                  className={category.is_active ? "" : "text-muted-foreground"}
                >
                  {category.is_active ? "تعطيل" : "تفعيل"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDelete(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-elevated"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">
                  {editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم الفئة</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: سلال"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="icon">الأيقونة (إيموجي)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🧺"
                    className="text-2xl"
                  />
                </div>

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر للفئة..."
                    className="w-full px-4 py-2 rounded-xl border border-border bg-background h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="sort_order">ترتيب العرض</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">فئة نشطة</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingCategory ? (
                      "تحديث"
                    ) : (
                      "إضافة"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
