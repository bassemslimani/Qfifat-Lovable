import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo-white.png";

type VerificationStatus = "loading" | "success" | "error" | "expired";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const type = searchParams.get("type");

      // Check if this is an email verification link
      if (type === "signup" && accessToken) {
        try {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            setStatus("error");
            return;
          }

          // Get user email
          if (data.user?.email) {
            setEmail(data.user.email);
          }

          setStatus("success");

          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } catch {
          setStatus("error");
        }
      } else if (!accessToken) {
        // No token - show resend option
        setStatus("error");
      } else {
        setStatus("error");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendVerification = async () => {
    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        toast({
          title: "خطأ",
          description: error.message || "فشل إعادة إرسال البريد",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم الإرسال",
          description: "تم إعادة إرسال بريد التأكيد",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="Qfifat" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary-foreground">قفيفات</h1>
          <p className="text-primary-foreground/70">القفيفات الحرفية الجزائرية</p>
        </div>

        {/* Verification Card */}
        <div className="bg-card rounded-2xl shadow-elevated p-6">
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-bold mb-2">جاري التحقق...</h2>
                <p className="text-muted-foreground">
                  يرجى الانتظار بينما نتحقق من بريدك الإلكتروني
                </p>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-300">
                  تم التحقق بنجاح!
                </h2>
                <p className="text-muted-foreground mb-6">
                  تم تأكيد بريدك الإلكتروني بنجاح. مرحباً بك في قفيفات!
                </p>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    سيتم نقلك إلى الصفحة الرئيسية تلقائياً...
                  </p>
                </div>
                <Button
                  variant="hero"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  الذهاب للصفحة الرئيسية
                </Button>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">تأكيد بريدك الإلكتروني</h2>
                <p className="text-muted-foreground mb-6">
                  يرجى تأكيد بريدك الإلكتروني لتفعيل حسابك
                </p>

                {!email ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3 text-right">
                        <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            تم إرسال رابط التأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك الوارد والنقر على الرابط.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => navigate("/auth")}
                      className="w-full"
                    >
                      <ArrowLeft className="h-4 w-4 ml-2" />
                      العودة لتسجيل الدخول
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      لم تستلم بريد التأكيد؟
                    </p>
                    <Button
                      variant="hero"
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="w-full"
                    >
                      {resending ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        "إعادة إرسال بريد التأكيد"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/auth")}
                      className="w-full"
                    >
                      العودة لتسجيل الدخول
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to home */}
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
