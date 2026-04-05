import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, Store, User, Search, Plus, Edit, Trash2, Phone, Mail, MapPin, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { wilayas } from "@/data/wilayas";

interface UserData {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  wilaya: string | null;
  role: string;
  created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  admin: { label: "مدير", icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  merchant: { label: "بائع", icon: Store, color: "text-emerald-600", bg: "bg-emerald-50" },
  user: { label: "عميل", icon: User, color: "text-blue-600", bg: "bg-blue-50" },
};

export function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  // Drawers
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", wilaya: "", city: "", address: "", role: "" });
  const [saving, setSaving] = useState(false);

  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Selected user detail view
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_admin_users_list");
    if (error) {
      console.error("Error fetching users:", error);
      toast({ title: "خطأ في جلب المستخدمين", variant: "destructive" });
    }
    setUsers(data || []);
    setLoading(false);
  };

  // ---- ADD ADMIN ----
  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      toast({ title: "الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setAddingAdmin(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast({ title: "الجلسة منتهية", variant: "destructive" }); setAddingAdmin(false); return; }
      const response = await fetch("/api/create-admin.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword, full_name: newAdminName || newAdminEmail, role: "admin" }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast({ title: "خطأ: " + (result.msg || result.error || "خطأ غير معروف"), variant: "destructive" });
      } else {
        toast({ title: "تم إنشاء حساب المدير بنجاح" });
        setShowAddAdmin(false);
        setNewAdminEmail(""); setNewAdminPassword(""); setNewAdminName("");
        fetchUsers();
      }
    } catch { toast({ title: "حدث خطأ غير متوقع", variant: "destructive" }); }
    setAddingAdmin(false);
  };

  // ---- EDIT USER ----
  const openEditDrawer = async (user: UserData) => {
    const { data } = await supabase.from("profiles").select("full_name, phone, wilaya, city, address").eq("user_id", user.user_id).single();
    setEditForm({
      full_name: data?.full_name || user.full_name || "",
      phone: data?.phone || user.phone || "",
      wilaya: data?.wilaya || user.wilaya || "",
      city: data?.city || "",
      address: data?.address || "",
      role: user.role,
    });
    setEditingUser(user);
    setSelectedUser(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    const { error: profileError } = await supabase.rpc("admin_update_profile", {
      target_user_id: editingUser.user_id,
      new_full_name: editForm.full_name || null,
      new_phone: editForm.phone || null,
      new_wilaya: editForm.wilaya || null,
      new_city: editForm.city || null,
      new_address: editForm.address || null,
    });
    if (profileError) { toast({ title: "خطأ في تحديث الملف الشخصي", variant: "destructive" }); setSaving(false); return; }
    if (editForm.role !== editingUser.role) {
      await supabase.from("user_roles").delete().eq("user_id", editingUser.user_id).eq("role", editingUser.role as any);
      await supabase.from("user_roles").upsert({ user_id: editingUser.user_id, role: editForm.role as any }, { onConflict: "user_id,role" });
    }
    toast({ title: "تم تحديث المستخدم بنجاح" });
    setEditingUser(null);
    setSaving(false);
    fetchUsers();
  };

  // ---- DELETE USER ----
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    const { error } = await supabase.rpc("admin_delete_user", { target_user_id: deletingUser.user_id });
    if (error) { toast({ title: "خطأ في حذف المستخدم: " + error.message, variant: "destructive" }); }
    else { toast({ title: "تم حذف المستخدم بنجاح" }); fetchUsers(); }
    setDeletingUser(null); setSelectedUser(null); setDeleting(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = !searchQuery ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const merchantCount = users.filter((u) => u.role === "merchant").length;
  const userCount = users.filter((u) => u.role === "user").length;

  return (
    <div className="space-y-4 pb-4">
      {/* ---- Sticky Search + Add ---- */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 -mx-1 px-1">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-11 rounded-xl bg-card border-0 shadow-sm"
            />
          </div>
          <Button onClick={() => setShowAddAdmin(true)} size="icon" className="h-11 w-11 rounded-xl flex-shrink-0">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* ---- Role Filter Pills ---- */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { key: null, label: `الكل (${users.length})` },
          { key: "admin", label: `مدراء (${adminCount})` },
          { key: "merchant", label: `بائعين (${merchantCount})` },
          { key: "user", label: `عملاء (${userCount})` },
        ].map((f) => (
          <button
            key={f.key || "all"}
            onClick={() => setRoleFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              roleFilter === f.key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-sm"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ---- Users List (Cards) ---- */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-secondary rounded" />
                  <div className="h-3 w-48 bg-secondary rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center shadow-sm">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">لا توجد نتائج</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-primary text-sm mt-2">مسح البحث</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredUsers.map((user, i) => {
              const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;
              const RoleIcon = role.icon;
              return (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedUser(user)}
                  className="bg-card rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full ${role.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-lg font-bold ${role.color}`}>
                        {user.full_name?.charAt(0) || "؟"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{user.full_name || "بدون اسم"}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${role.bg} ${role.color} flex-shrink-0`}>
                          <RoleIcon className="h-2.5 w-2.5" />
                          {role.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5" dir="ltr">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{user.phone}</p>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronLeft className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ---- USER DETAIL DRAWER ---- */}
      <Drawer open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-right">
            <DrawerTitle>تفاصيل المستخدم</DrawerTitle>
          </DrawerHeader>
          {selectedUser && (() => {
            const role = ROLE_CONFIG[selectedUser.role] || ROLE_CONFIG.user;
            const RoleIcon = role.icon;
            return (
              <div className="px-4 pb-2 space-y-5 overflow-y-auto">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-20 h-20 rounded-full ${role.bg} flex items-center justify-center mb-3`}>
                    <span className={`text-3xl font-bold ${role.color}`}>
                      {selectedUser.full_name?.charAt(0) || "؟"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{selectedUser.full_name || "بدون اسم"}</h3>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${role.bg} ${role.color} mt-1`}>
                    <RoleIcon className="h-3 w-3" />
                    {role.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate" dir="ltr">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm" dir="ltr">{selectedUser.phone || "غير محدد"}</span>
                  </div>
                  {selectedUser.wilaya && (
                    <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{selectedUser.wilaya}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">تاريخ التسجيل: {new Date(selectedUser.created_at).toLocaleDateString("ar-DZ")}</span>
                  </div>
                </div>
              </div>
            );
          })()}
          <DrawerFooter className="flex-row gap-2 pt-2">
            <Button
              className="flex-1 h-12 rounded-xl gap-2"
              onClick={() => selectedUser && openEditDrawer(selectedUser)}
            >
              <Edit className="h-4 w-4" />
              تعديل
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => { if (selectedUser) { setDeletingUser(selectedUser); } }}
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ---- ADD ADMIN DRAWER ---- */}
      <Drawer open={showAddAdmin} onOpenChange={setShowAddAdmin}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-right">
            <DrawerTitle>إضافة مدير جديد</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input placeholder="اسم المدير" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني *</Label>
              <Input type="email" placeholder="admin@example.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} dir="ltr" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور *</Label>
              <Input type="password" placeholder="كلمة مرور قوية" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} dir="ltr" className="h-12 rounded-xl" />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleAddAdmin} disabled={addingAdmin} className="h-12 rounded-xl">
              {addingAdmin ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الإنشاء...</> : "إنشاء حساب المدير"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="h-12 rounded-xl">إلغاء</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ---- EDIT USER DRAWER ---- */}
      <Drawer open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-right">
            <DrawerTitle>تعديل المستخدم</DrawerTitle>
          </DrawerHeader>
          {editingUser && (
            <div className="px-4 space-y-4 overflow-y-auto pb-2">
              <div className="bg-secondary/50 rounded-xl p-3 text-sm text-muted-foreground text-center" dir="ltr">
                {editingUser.email}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>الهاتف</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} dir="ltr" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>الدور</Label>
                  <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">عميل</SelectItem>
                      <SelectItem value="merchant">بائع</SelectItem>
                      <SelectItem value="admin">مدير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الولاية</Label>
                  <Select value={editForm.wilaya} onValueChange={(v) => setEditForm({ ...editForm, wilaya: v })}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                    <SelectContent>
                      {wilayas.map((w) => (<SelectItem key={w} value={w}>{w}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="h-12 rounded-xl" />
                </div>
              </div>
            </div>
          )}
          <DrawerFooter>
            <Button onClick={handleSaveEdit} disabled={saving} className="h-12 rounded-xl">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الحفظ...</> : "حفظ التعديلات"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="h-12 rounded-xl">إلغاء</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ---- DELETE CONFIRMATION ---- */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => { if (!open) setDeletingUser(null); }}>
        <AlertDialogContent className="rounded-2xl mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف <strong>{deletingUser?.full_name || deletingUser?.email}</strong>؟
              <br />
              سيتم حذف حسابه نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl mt-0">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={deleting} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700">
              {deleting ? "جاري الحذف..." : "حذف نهائياً"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
