import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 2500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<"logo" | "reveal" | "exit">("logo");

  useEffect(() => {
    // Phase 1: Logo animation
    const logoTimer = setTimeout(() => setPhase("reveal"), 800);
    
    // Phase 2: Reveal animation
    const revealTimer = setTimeout(() => setPhase("exit"), minDuration - 500);
    
    // Phase 3: Exit
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400);
    }, minDuration);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(revealTimer);
      clearTimeout(exitTimer);
    };
  }, [minDuration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[1000] bg-gradient-hero flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Animated ripple circles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0.3 }}
                animate={{ 
                  scale: [0, 6], 
                  opacity: [0.2, 0] 
                }}
                transition={{ 
                  duration: 2.5, 
                  delay: i * 0.4,
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-primary-foreground/40"
              />
            ))}
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 400 - 200,
                  y: 100,
                  opacity: 0 
                }}
                animate={{ 
                  y: -100,
                  opacity: [0, 0.6, 0],
                }}
                transition={{ 
                  duration: 2 + Math.random(),
                  delay: 0.5 + i * 0.3,
                  ease: "easeOut"
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary-foreground/40"
              />
            ))}
          </div>

          {/* Main logo container with glow */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ 
              scale: phase === "exit" ? 1.2 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="relative z-10"
          >
            {/* Pulsing glow ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-foreground/20 to-accent/30 blur-xl scale-150"
            />
            
            {/* Logo with spin entrance */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
            >
              <motion.img
                src={logo}
                alt="قفيفات"
                className="w-32 h-32 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                animate={{
                  filter: phase === "reveal" 
                    ? ["brightness(1)", "brightness(1.2)", "brightness(1)"]
                    : "brightness(1)"
                }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>
          </motion.div>

          {/* Brand name with letter animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
            className="mt-8 overflow-hidden"
          >
            <motion.h1
              className="text-4xl font-bold text-primary-foreground"
              animate={{
                textShadow: phase === "reveal"
                  ? "0 0 20px rgba(255,255,255,0.5)"
                  : "0 0 0px rgba(255,255,255,0)"
              }}
            >
              {"قفيفات".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
            </motion.h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-primary-foreground/70 text-sm mt-3 tracking-wide"
          >
            صناعة حرفية جزائرية أصيلة
          </motion.p>

          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-12 w-32 h-1 bg-primary-foreground/20 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary-foreground/60 to-transparent"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
