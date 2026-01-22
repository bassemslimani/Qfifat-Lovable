import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo-white.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [tokenType, setTokenType] = useState<"supabase" | "custom" | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [customToken, setCustomToken] = useState("");

  useEffect(() => {
    // Check if we have Supabase's access token (from Supabase email flow)
    const accessToken = searchParams.get("access_token");

    // Check if we have our custom token (from our beautiful email flow)
    const customResetToken = searchParams.get("token");

    if (accessToken) {
      setHasValidToken(true);
      setTokenType("supabase");
      // Set the session with the access token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: searchParams.get("refresh_token") || "",
      });
    } else if (customResetToken) {
      setHasValidToken(true);
      setTokenType("custom");
      setCustomToken(customResetToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (tokenType === "supabase") {
        // Use Supabase's built-in update (user is already authenticated)
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) throw error;
      } else if (tokenType === "custom") {
        // Use our backend to verify token and update password
        const response = await fetch(`/api/email.php?endpoint=/api/update-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: customToken,
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "فشل تحديث كلمة المرور");
        }
      }

      setSuccess(true);
      toast({
        title: "تم بنجاح!",
        description: "تم تحديث كلمة المرور بنجاح",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل تحديث كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show error if no valid token
  if (!hasValidToken) {
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
          </div>

          <div className="bg-card rounded-2xl shadow-elevated p-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-destructive">رابط غير صالح</h2>
            <p className="text-muted-foreground mb-6">
              يرجى استخدام رابط إعادة تعيين كلمة المرور المرسل إلى بريدك الإلكتروني.
            </p>
            <Button onClick={() => navigate("/auth")} variant="hero">
              العودة لتسجيل الدخول
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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

        {/* Reset Password Card */}
        <div className="bg-card rounded-2xl shadow-elevated p-6">
          {!success ? (
            <>
              <h2 className="text-xl font-bold mb-2 text-center">إعادة تعيين كلمة المرور</h2>
              <p className="text-muted-foreground text-center mb-6">
                أدخل كلمة المرور الجديدة لحسابك
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">كلمة المرور الجديدة</Label>
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

                <div>
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10 pl-10"
                      dir="ltr"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive">كلمات المرور غير متطابقة</p>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={loading || password !== confirmPassword}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "تحديث كلمة المرور"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">
                تم تحديث كلمة المرور بنجاح!
              </h2>
              <p className="text-muted-foreground mb-6">
                سيتم نقلك إلى صفحة تسجيل الدخول...
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                الذهاب إلى تسجيل الدخول
              </Button>
            </motion.div>
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
