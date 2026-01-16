import { motion } from "framer-motion";
import { Download, Smartphone, Bell, Wifi, Zap, Check, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { usePWA } from "@/hooks/usePWA";

export default function Install() {
  const { isInstallable, isInstalled, installApp, requestNotificationPermission } = usePWA();

  const features = [
    { icon: Zap, title: "سريع جداً", description: "تحميل فوري بدون انتظار" },
    { icon: Wifi, title: "يعمل بدون إنترنت", description: "تصفح المنتجات حتى بدون اتصال" },
    { icon: Bell, title: "إشعارات فورية", description: "تنبيهات بالعروض وتتبع الطلبات" },
    { icon: Smartphone, title: "مثل التطبيق", description: "تجربة أصلية على هاتفك" },
  ];

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      await requestNotificationPermission();
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Download className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">ثبّت تطبيق قفيفات</h1>
          <p className="text-muted-foreground">
            احصل على تجربة تسوق أفضل مع تطبيق قفيفات
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Install Section */}
        {isInstalled ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">التطبيق مثبت!</h2>
            <p className="text-muted-foreground">
              يمكنك الآن استخدام التطبيق من الشاشة الرئيسية
            </p>
          </motion.div>
        ) : isInstallable ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 shadow-card text-center"
          >
            <Button onClick={handleInstall} size="lg" className="w-full">
              <Download className="h-5 w-5 ml-2" />
              تثبيت التطبيق
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 shadow-card"
          >
            <h2 className="font-bold text-foreground mb-4 text-center">كيفية التثبيت</h2>
            
            {isIOS ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">اضغط على زر المشاركة</p>
                    <Share className="h-5 w-5 text-muted-foreground mt-1" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">اختر "إضافة إلى الشاشة الرئيسية"</p>
                    <Plus className="h-5 w-5 text-muted-foreground mt-1" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <p className="text-sm">اضغط "إضافة"</p>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <p className="text-sm">اضغط على القائمة ⋮ في المتصفح</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <p className="text-sm">اختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية"</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <p className="text-sm">وافق على التثبيت</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center">
                افتح هذه الصفحة من متصفح الهاتف لتتمكن من تثبيت التطبيق
              </p>
            )}
          </motion.div>
        )}

        {/* Notification Permission */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-accent/10 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-accent" />
              <div>
                <h3 className="font-medium text-foreground">فعّل الإشعارات</h3>
                <p className="text-xs text-muted-foreground">
                  احصل على تنبيهات فورية بالعروض وحالة الطلبات
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={requestNotificationPermission}
              >
                تفعيل
              </Button>
            </div>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
