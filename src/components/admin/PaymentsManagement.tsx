import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Eye,
  CheckCircle,
  XCircle,
  X,
  Download,
  ExternalLink,
  AlertTriangle,
  Clock,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: "barid" | "stripe";
  status: "pending" | "verified" | "failed" | "refunded";
  admin_notes: string | null;
  created_at: string;
  verified_at: string | null;
  orders: {
    order_number: string;
    shipping_name: string;
    shipping_phone: string;
    shipping_wilaya: string;
    total: number;
  } | null;
  payment_proofs: {
    id: string;
    file_url: string;
    file_name: string;
    created_at: string;
  }[];
}

export function PaymentsManagement() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "failed">("all");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        orders(order_number, shipping_name, shipping_phone, shipping_wilaya, total),
        payment_proofs(id, file_url, file_name, created_at)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPayments(data as Payment[]);
    }
    setLoading(false);
  };

  const handleApprove = async (payment: Payment) => {
    setProcessing(true);
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
        })
        .eq("id", payment.id);

      if (paymentError) throw paymentError;

      // Update order status to confirmed
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", payment.order_id);

      if (orderError) throw orderError;

      toast.success("تم تأكيد الدفع بنجاح");
      setShowProofModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("حدث خطأ أثناء تأكيد الدفع");
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!rejectReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "failed",
          admin_notes: rejectReason,
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      // Update order status to cancelled
      await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", selectedPayment.order_id);

      toast.success("تم رفض الدفع");
      setShowRejectModal(false);
      setShowProofModal(false);
      setSelectedPayment(null);
      setRejectReason("");
      fetchPayments();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("حدث خطأ أثناء رفض الدفع");
    }
    setProcessing(false);
  };

  const openProofModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowProofModal(true);
  };

  const openRejectModal = () => {
    setShowRejectModal(true);
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const statusConfig = {
    pending: { label: "قيد التحقق", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    verified: { label: "مؤكد", color: "bg-green-100 text-green-700", icon: CheckCircle },
    failed: { label: "مرفوض", color: "bg-red-100 text-red-700", icon: XCircle },
    refunded: { label: "مسترجع", color: "bg-gray-100 text-gray-700", icon: AlertTriangle },
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-bold">المدفوعات ({payments.length})</h3>
        <div className="flex gap-2">
          {(["all", "pending", "verified", "failed"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "الكل" : statusConfig[status].label}
            </Button>
          ))}
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center shadow-card">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {filter === "all" ? "لا توجد مدفوعات بعد" : `لا توجد مدفوعات ${statusConfig[filter]?.label}`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => {
            const StatusIcon = statusConfig[payment.status]?.icon || Clock;
            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-bold text-foreground">
                        #{payment.orders?.order_number}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          payment.method === "barid"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {payment.method === "barid" ? "بريد الجزائر" : "Stripe"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${statusConfig[payment.status]?.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[payment.status]?.label}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium text-foreground">العميل:</span>{" "}
                        {payment.orders?.shipping_name} - {payment.orders?.shipping_wilaya}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">الهاتف:</span>{" "}
                        {payment.orders?.shipping_phone}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">التاريخ:</span>{" "}
                        {new Date(payment.created_at).toLocaleDateString("ar-DZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {payment.admin_notes && (
                        <p className="text-red-600">
                          <span className="font-medium">سبب الرفض:</span> {payment.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-xl font-bold text-primary block mb-2">
                      {payment.amount.toLocaleString()} دج
                    </span>

                    {payment.method === "barid" && (
                      <div className="flex flex-col gap-2">
                        {payment.payment_proofs?.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openProofModal(payment)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            عرض الإثبات ({payment.payment_proofs.length})
                          </Button>
                        )}
                        {payment.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                if (payment.payment_proofs?.length > 0) {
                                  openProofModal(payment);
                                } else {
                                  handleApprove(payment);
                                }
                              }}
                              className="gap-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              تأكيد
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedPayment(payment);
                                openRejectModal();
                              }}
                              className="gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              رفض
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Payment Proof Modal */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              إثبات الدفع - #{selectedPayment?.orders?.order_number}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Info */}
            <div className="bg-secondary rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ:</span>
                <span className="font-bold text-primary">
                  {selectedPayment?.amount.toLocaleString()} دج
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">العميل:</span>
                <span className="font-medium">{selectedPayment?.orders?.shipping_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الهاتف:</span>
                <span className="font-medium">{selectedPayment?.orders?.shipping_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الولاية:</span>
                <span className="font-medium">{selectedPayment?.orders?.shipping_wilaya}</span>
              </div>
            </div>

            {/* Payment Proofs */}
            {selectedPayment?.payment_proofs && selectedPayment.payment_proofs.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold">صور إثبات الدفع:</h4>
                <div className="grid gap-4">
                  {selectedPayment.payment_proofs.map((proof) => (
                    <div key={proof.id} className="border rounded-xl overflow-hidden">
                      <div className="bg-secondary px-3 py-2 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{proof.file_name}</span>
                        <div className="flex gap-2">
                          <a
                            href={proof.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            فتح
                          </a>
                          <a
                            href={proof.file_url}
                            download={proof.file_name}
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            <Download className="h-4 w-4" />
                            تحميل
                          </a>
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50">
                        <img
                          src={proof.file_url}
                          alt={proof.file_name}
                          className="w-full max-h-96 object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-secondary rounded-xl">
                <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لا توجد صور إثبات دفع مرفوعة</p>
              </div>
            )}
          </div>

          {selectedPayment?.status === "pending" && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="destructive"
                onClick={openRejectModal}
                disabled={processing}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                رفض الدفع
              </Button>
              <Button
                onClick={() => selectedPayment && handleApprove(selectedPayment)}
                disabled={processing}
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                {processing ? "جاري التأكيد..." : "تأكيد الدفع"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              رفض الدفع
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              أنت على وشك رفض دفع الطلب #{selectedPayment?.orders?.order_number}
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">سبب الرفض *</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="أدخل سبب رفض الدفع (مثال: صورة غير واضحة، المبلغ غير مطابق...)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
              }}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? "جاري الرفض..." : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
