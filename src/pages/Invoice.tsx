import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Printer, Download, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import logo from "@/assets/logo.png";

interface InvoiceData {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  subtotal: number;
  shipping_cost: number | null;
  total: number;
  status: string;
  issued_at: string;
  paid_at: string | null;
  order?: {
    order_number: string;
    shipping_wilaya: string;
    shipping_city: string;
    order_items: {
      id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }[];
  };
}

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        order:orders!invoices_order_id_fkey (
          order_number,
          shipping_wilaya,
          shipping_city,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        )
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      setInvoice(data as unknown as InvoiceData);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <h2 className="text-xl font-bold mb-4">الفاتورة غير موجودة</h2>
          <Button onClick={() => navigate("/account")}>العودة للحساب</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 print:pt-0 print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>
      
      {/* Actions - Hidden in print */}
      <div className="container py-4 pt-safe print:hidden">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-5 w-5" />
            <span>رجوع</span>
          </button>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <motion.div
        ref={printRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container max-w-3xl py-6 print:py-0 print:max-w-none"
      >
        <div className="bg-card rounded-2xl p-8 shadow-card print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 border-b border-border pb-6">
            <div>
              <img src={logo} alt="قفيفات" className="h-16 w-16 mb-2" />
              <h1 className="text-2xl font-bold text-foreground">قفيفات</h1>
              <p className="text-sm text-muted-foreground">الحرف اليدوية الجزائرية</p>
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-primary mb-1">فاتورة</h2>
              <p className="font-mono text-lg">{invoice.invoice_number}</p>
              <p className="text-sm text-muted-foreground mt-2">
                تاريخ الإصدار: {format(new Date(invoice.issued_at), "d MMMM yyyy", { locale: ar })}
              </p>
              {invoice.paid_at && (
                <p className="text-sm text-primary">
                  تاريخ الدفع: {format(new Date(invoice.paid_at), "d MMMM yyyy", { locale: ar })}
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              invoice.status === "paid" 
                ? "bg-primary/10 text-primary" 
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {invoice.status === "paid" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  مدفوعة
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  في انتظار الدفع
                </>
              )}
            </span>
          </div>

          {/* Customer & Order Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3">معلومات العميل</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">الاسم:</span> {invoice.customer_name}</p>
                {invoice.customer_phone && (
                  <p><span className="text-muted-foreground">الهاتف:</span> {invoice.customer_phone}</p>
                )}
                {invoice.customer_email && (
                  <p><span className="text-muted-foreground">البريد:</span> {invoice.customer_email}</p>
                )}
                {invoice.customer_address && (
                  <p><span className="text-muted-foreground">العنوان:</span> {invoice.customer_address}</p>
                )}
              </div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3">معلومات الطلب</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">رقم الطلب:</span> {invoice.order?.order_number}</p>
                <p><span className="text-muted-foreground">الولاية:</span> {invoice.order?.shipping_wilaya}</p>
                <p><span className="text-muted-foreground">البلدية:</span> {invoice.order?.shipping_city}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="font-bold text-foreground mb-4">تفاصيل المنتجات</h3>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-right px-4 py-3 text-sm font-medium">المنتج</th>
                    <th className="text-center px-4 py-3 text-sm font-medium">الكمية</th>
                    <th className="text-center px-4 py-3 text-sm font-medium">السعر</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">المجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.order?.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">{item.product_name}</td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-center">{item.unit_price.toLocaleString()} دج</td>
                      <td className="px-4 py-3 text-left font-medium">{item.total_price.toLocaleString()} دج</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{invoice.subtotal.toLocaleString()} دج</span>
              </div>
              {invoice.shipping_cost && invoice.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">تكلفة الشحن</span>
                  <span>{invoice.shipping_cost.toLocaleString()} دج</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>الإجمالي</span>
                <span className="text-primary">{invoice.total.toLocaleString()} دج</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>شكراً لتسوقكم معنا!</p>
            <p className="mt-1">قفيفات - الحرف اليدوية الجزائرية الأصيلة</p>
          </div>
        </div>
      </motion.div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #root {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
