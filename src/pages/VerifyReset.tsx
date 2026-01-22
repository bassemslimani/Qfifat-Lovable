import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-white.png";

export default function VerifyReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("error");
        setMessage("رابط إعادة التعيين غير صالح");
        return;
      }

      try {
        // Call backend to verify token and initiate Supabase recovery
        const response = await fetch(`/api/email.php?endpoint=/api/verify-reset-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setStatus("error");
          setMessage(data.error || "فشل التحقق من الرابط");
          return;
        }

        setStatus("success");

        // Redirect to reset page after a short delay
        setTimeout(() => {
          navigate("/auth/reset-password", { replace: true });
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage("حدث خطأ أثناء التحقق");
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img src={logo} alt="Qfifat" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary-foreground">قفيفات</h1>
          <p className="text-primary-foreground/70">القفيفات الحرفية الجزائرية</p>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated p-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-bold mb-2">جاري التحقق...</h2>
              <p className="text-muted-foreground">
                يرجى الانتظار بينما نتحقق من رابط إعادة التعيين
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">
                تم التحقق بنجاح!
              </h2>
              <p className="text-muted-foreground">
                جاري تحويلك إلى صفحة إعادة تعيين كلمة المرور...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2 text-destructive">
                رابط غير صالح
              </h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => navigate("/auth")} variant="hero">
                العودة لتسجيل الدخول
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => navigate("/")}
          className="w-full text-center text-sm text-primary-foreground/70 mt-6 hover:text-primary-foreground"
        >
          العودة للصفحة الرئيسية
        </button>
      </motion.div>
    </div>
  );
}
