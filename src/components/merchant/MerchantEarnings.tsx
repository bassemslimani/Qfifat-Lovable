import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, DollarSign, Clock, CheckCircle, 
  ArrowDownToLine, Loader2, CreditCard, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Earning {
  id: string;
  amount: number;
  commission_amount: number;
  commission_rate: number;
  net_amount: number;
  status: string;
  created_at: string;
  order_id: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  payment_method: string;
  payment_details: any;
  status: string;
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
}

export function MerchantEarnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    payment_method: "ccp",
    ccp_number: "",
    ccp_key: "",
    account_name: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch earnings
    const { data: earningsData } = await supabase
      .from("merchant_earnings")
      .select("*")
      .eq("merchant_id", user?.id)
      .order("created_at", { ascending: false });

    if (earningsData) setEarnings(earningsData);

    // Fetch withdrawals
    const { data: withdrawalsData } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("merchant_id", user?.id)
      .order("created_at", { ascending: false });

    if (withdrawalsData) setWithdrawals(withdrawalsData);
    
    setLoading(false);
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + e.net_amount, 0);
  const pendingEarnings = earnings.filter(e => e.status === "pending").reduce((sum, e) => sum + e.net_amount, 0);
  const paidEarnings = earnings.filter(e => e.status === "paid").reduce((sum, e) => sum + e.net_amount, 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = pendingEarnings - pendingWithdrawals;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawForm.amount);
    if (amount > availableBalance) {
      toast({ title: "المبلغ أكبر من الرصيد المتاح", variant: "destructive" });
      return;
    }

    if (amount < 1000) {
      toast({ title: "الحد الأدنى للسحب 1000 دج", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("withdrawal_requests")
      .insert([{
        merchant_id: user?.id,
        amount,
        payment_method: withdrawForm.payment_method,
        payment_details: {
          ccp_number: withdrawForm.ccp_number,
          ccp_key: withdrawForm.ccp_key,
          account_name: withdrawForm.account_name,
        },
        status: "pending",
      }]);

    if (error) {
      toast({ title: "خطأ في إرسال الطلب", variant: "destructive" });
    } else {
      toast({ title: "تم إرسال طلب السحب بنجاح" });
      setShowWithdrawForm(false);
      setWithdrawForm({
        amount: "",
        payment_method: "ccp",
        ccp_number: "",
        ccp_key: "",
        account_name: "",
      });
      fetchData();
    }

    setSubmitting(false);
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "قيد المعالجة", color: "bg-yellow-100 text-yellow-700" },
    approved: { label: "تم القبول", color: "bg-blue-100 text-blue-700" },
    completed: { label: "تم التحويل", color: "bg-primary/10 text-primary" },
    rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{totalEarnings.toLocaleString()} دج</p>
          <p className="text-sm text-muted-foreground">إجمالي الأرباح</p>
        </div>
        
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center mb-3">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{pendingEarnings.toLocaleString()} دج</p>
          <p className="text-sm text-muted-foreground">أرباح معلقة</p>
        </div>
        
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3">
            <CheckCircle className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{paidEarnings.toLocaleString()} دج</p>
          <p className="text-sm text-muted-foreground">تم تحويله</p>
        </div>
        
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-3">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{availableBalance.toLocaleString()} دج</p>
          <p className="text-sm text-muted-foreground">متاح للسحب</p>
        </div>
      </div>

      {/* Withdraw Button */}
      <Button 
        onClick={() => setShowWithdrawForm(true)} 
        disabled={availableBalance < 1000}
        className="w-full"
        size="lg"
      >
        <ArrowDownToLine className="h-5 w-5 ml-2" />
        طلب سحب الأرباح
      </Button>

      {/* Withdrawals History */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <h3 className="font-bold mb-4">سجل طلبات السحب</h3>
        
        {withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد طلبات سحب بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <motion.div
                key={withdrawal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{withdrawal.amount.toLocaleString()} دج</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    statusLabels[withdrawal.status]?.color
                  }`}>
                    {statusLabels[withdrawal.status]?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{withdrawal.payment_method === "ccp" ? "بريد الجزائر CCP" : withdrawal.payment_method}</span>
                  <span>{new Date(withdrawal.created_at).toLocaleDateString("ar-DZ")}</span>
                </div>
                {withdrawal.admin_notes && (
                  <p className="text-sm text-muted-foreground mt-2 bg-background rounded-lg p-2">
                    {withdrawal.admin_notes}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Earnings History */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <h3 className="font-bold mb-4">سجل الأرباح</h3>
        
        {earnings.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد أرباح بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {earnings.slice(0, 10).map((earning) => (
              <div
                key={earning.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium">طلب #{earning.order_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    عمولة {(earning.commission_rate * 100).toFixed(0)}% = {earning.commission_amount.toLocaleString()} دج
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-primary">+{earning.net_amount.toLocaleString()} دج</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(earning.created_at).toLocaleDateString("ar-DZ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Form Modal */}
      <AnimatePresence>
        {showWithdrawForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4"
            onClick={() => setShowWithdrawForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-elevated"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">طلب سحب الأرباح</h3>
                <button onClick={() => setShowWithdrawForm(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="bg-secondary rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground">الرصيد المتاح للسحب</p>
                <p className="text-2xl font-bold text-primary">{availableBalance.toLocaleString()} دج</p>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <Label htmlFor="amount">المبلغ المطلوب (دج)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                    placeholder="مثال: 5000"
                    min={1000}
                    max={availableBalance}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">الحد الأدنى: 1000 دج</p>
                </div>

                <div>
                  <Label htmlFor="account_name">اسم صاحب الحساب</Label>
                  <Input
                    id="account_name"
                    value={withdrawForm.account_name}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, account_name: e.target.value })}
                    placeholder="الاسم الكامل كما هو في الحساب"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ccp_number">رقم CCP</Label>
                    <Input
                      id="ccp_number"
                      value={withdrawForm.ccp_number}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, ccp_number: e.target.value })}
                      placeholder="1234567890"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ccp_key">المفتاح</Label>
                    <Input
                      id="ccp_key"
                      value={withdrawForm.ccp_key}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, ccp_key: e.target.value })}
                      placeholder="00"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ArrowDownToLine className="h-4 w-4 ml-2" />
                      إرسال طلب السحب
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
