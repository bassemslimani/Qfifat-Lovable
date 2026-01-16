import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Store, User, Search, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Get all user roles with profiles
    const { data: rolesData, error } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        role,
        created_at,
        profiles!inner (
          id,
          full_name,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
      return;
    }

    // Get emails from auth - we'll match by user_id
    const usersList = rolesData?.map((item: any) => ({
      id: item.user_id,
      email: "", // Will be filled from profiles or show user_id
      full_name: item.profiles?.full_name || null,
      phone: item.profiles?.phone || null,
      role: item.role,
      created_at: item.created_at,
    })) || [];

    setUsers(usersList);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as any })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "خطأ في تغيير الدور", variant: "destructive" });
    } else {
      toast({ title: "تم تغيير الدور بنجاح" });
      fetchUsers();
    }
  };

  const roleLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    admin: { label: "مدير", icon: Shield, color: "bg-red-100 text-red-700" },
    merchant: { label: "بائع", icon: Store, color: "bg-accent/10 text-accent" },
    customer: { label: "عميل", icon: User, color: "bg-primary/10 text-primary" },
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.id.includes(searchQuery)
  );

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="font-bold">إدارة المستخدمين ({users.length})</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <Shield className="h-6 w-6 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{users.filter(u => u.role === "admin").length}</p>
          <p className="text-xs text-muted-foreground">مدراء</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <Store className="h-6 w-6 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold">{users.filter(u => u.role === "merchant").length}</p>
          <p className="text-xs text-muted-foreground">بائعين</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <User className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{users.filter(u => u.role === "customer").length}</p>
          <p className="text-xs text-muted-foreground">عملاء</p>
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center shadow-card">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد نتائج</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-right px-4 py-3 text-sm font-medium">المستخدم</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">الهاتف</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">الدور</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">تاريخ التسجيل</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const roleInfo = roleLabels[user.role] || roleLabels.customer;
                  return (
                    <tr key={user.id} className="hover:bg-secondary/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user.full_name?.charAt(0) || "؟"}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || "بدون اسم"}</p>
                            <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.phone || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${roleInfo.color}`}>
                          <roleInfo.icon className="h-3 w-3" />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("ar-DZ")}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-border bg-background text-sm"
                        >
                          <option value="customer">عميل</option>
                          <option value="merchant">بائع</option>
                          <option value="admin">مدير</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
