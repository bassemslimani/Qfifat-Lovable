import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Eye, Printer, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  subtotal: number;
  shipping_cost: number | null;
  total: number;
  status: string | null;
  issued_at: string;
  paid_at: string | null;
  orders?: {
    order_number: string;
    shipping_wilaya: string;
  };
}

export function InvoicesManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, orders(order_number, shipping_wilaya)")
      .order("issued_at", { ascending: false });

    if (!error && data) {
      setInvoices(data as Invoice[]);
    }
    setLoading(false);
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
    paid: { label: "مدفوعة", color: "bg-primary/10 text-primary" },
    cancelled: { label: "ملغاة", color: "bg-red-100 text-red-700" },
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.orders?.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const printInvoice = (invoice: Invoice) => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>فاتورة ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2d7a5c; margin: 0; }
            .info { margin-bottom: 20px; }
            .info p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
            th { background: #f5f5f5; }
            .total { font-size: 1.2em; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>قفيفات</h1>
            <p>فاتورة رقم: ${invoice.invoice_number}</p>
          </div>
          <div class="info">
            <p><strong>العميل:</strong> ${invoice.customer_name}</p>
            <p><strong>الهاتف:</strong> ${invoice.customer_phone || "-"}</p>
            <p><strong>العنوان:</strong> ${invoice.customer_address || "-"}</p>
            <p><strong>التاريخ:</strong> ${new Date(invoice.issued_at).toLocaleDateString("ar-DZ")}</p>
          </div>
          <table>
            <tr>
              <th>البند</th>
              <th>المبلغ</th>
            </tr>
            <tr>
              <td>المجموع الفرعي</td>
              <td>${invoice.subtotal.toLocaleString()} دج</td>
            </tr>
            <tr>
              <td>تكلفة الشحن</td>
              <td>${(invoice.shipping_cost || 0).toLocaleString()} دج</td>
            </tr>
            <tr class="total">
              <td>المجموع الكلي</td>
              <td>${invoice.total.toLocaleString()} دج</td>
            </tr>
          </table>
          <div class="footer">
            <p>شكراً لتسوقكم من قفيفات</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="font-bold">الفواتير ({invoices.length})</h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الفاتورة أو العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-primary">{invoices.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي الفواتير</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-primary">
            {invoices.filter(i => i.status === "paid").length}
          </p>
          <p className="text-xs text-muted-foreground">فواتير مدفوعة</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-accent">
            {invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString()} دج
          </p>
          <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center shadow-card">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد فواتير</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-right px-4 py-3 text-sm font-medium">رقم الفاتورة</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">العميل</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">المبلغ</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">الحالة</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">التاريخ</th>
                  <th className="text-right px-4 py-3 text-sm font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((invoice) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-secondary/50"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{invoice.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{invoice.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-primary">{invoice.total.toLocaleString()} دج</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        statusLabels[invoice.status || "pending"]?.color
                      }`}>
                        {statusLabels[invoice.status || "pending"]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(invoice.issued_at).toLocaleDateString("ar-DZ")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => printInvoice(invoice)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4"
          onClick={() => setSelectedInvoice(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-elevated"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">فاتورة {selectedInvoice.invoice_number}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-secondary rounded-xl p-4">
                <h4 className="font-medium mb-2">معلومات العميل</h4>
                <p>{selectedInvoice.customer_name}</p>
                <p className="text-sm text-muted-foreground">{selectedInvoice.customer_phone}</p>
                <p className="text-sm text-muted-foreground">{selectedInvoice.customer_address}</p>
              </div>

              <div className="bg-secondary rounded-xl p-4">
                <h4 className="font-medium mb-2">تفاصيل الفاتورة</h4>
                <div className="flex justify-between py-2 border-b border-border">
                  <span>المجموع الفرعي</span>
                  <span>{selectedInvoice.subtotal.toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span>تكلفة الشحن</span>
                  <span>{(selectedInvoice.shipping_cost || 0).toLocaleString()} دج</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>المجموع الكلي</span>
                  <span className="text-primary">{selectedInvoice.total.toLocaleString()} دج</span>
                </div>
              </div>

              <Button className="w-full" onClick={() => printInvoice(selectedInvoice)}>
                <Printer className="h-4 w-4 ml-2" />
                طباعة الفاتورة
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
