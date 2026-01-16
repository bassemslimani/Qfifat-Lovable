import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo-white.png";

type AuthMode = "login" | "register" | "forgot";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "خطأ",
              description: "هذا البريد الإلكتروني مسجل مسبقاً",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "تم التسجيل بنجاح!",
            description: "مرحباً بك في قفيفات",
          });
        }
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "خطأ",
              description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "تم تسجيل الدخول",
            description: "مرحباً بعودتك!",
          });
        }
      } else if (mode === "forgot") {
        // Handle forgot password
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          toast({
            title: "خطأ",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setResetEmailSent(true);
          toast({
            title: "تم إرسال البريد",
            description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMode("login");
    setResetEmailSent(false);
    setEmail("");
    setPassword("");
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

        {/* Auth Card */}
        <div className="bg-card rounded-2xl shadow-elevated p-6">
          {/* Header - Show tabs for login/register, back button for forgot */}
          {mode !== "forgot" ? (
            <div className="flex bg-secondary rounded-xl p-1 mb-6">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === "register"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                حساب جديد
              </button>
            </div>
          ) : (
            <button
              onClick={handleBackToLogin}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="text-sm font-semibold">العودة لتسجيل الدخول</span>
            </button>
          )}

          {/* Success message for forgot password */}
          {mode === "forgot" && resetEmailSent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 dark:text-green-200">تم الإرسال بنجاح!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من بريدك الوارد واتباع التعليمات.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="أدخل اسمك الكامل"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0555123456"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email">
                {mode === "forgot" ? "البريد الإلكتروني" : "البريد الإلكتروني"}
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  dir="ltr"
                  required
                  disabled={resetEmailSent}
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10"
                    dir="ltr"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading || resetEmailSent}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "تسجيل الدخول" :
                   mode === "register" ? "إنشاء حساب" :
                   "إرسال رابط إعادة التعيين"}
                  {mode !== "forgot" && <ArrowRight className="h-4 w-4" />}
                </>
              )}
            </Button>
          </form>

          {mode === "login" && (
            <button
              onClick={() => setMode("forgot")}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          )}

          {/* Resend email link for forgot password */}
          {mode === "forgot" && resetEmailSent && (
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setResetEmailSent(false);
                  handleSubmit(new MouseEvent("submit") as any);
                }}
                className="text-sm text-primary hover:underline"
              >
                لم تستلم البريد؟ إعادة الإرسال
              </button>
            </div>
          )}
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
