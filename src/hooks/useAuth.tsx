import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isMerchant: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);

  const checkUserRole = async (userId: string): Promise<{ isAdmin: boolean; isMerchant: boolean }> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error checking user role:", error);
        return { isAdmin: false, isMerchant: false };
      }

      if (data && data.length > 0) {
        const roles = data.map(r => r.role);
        return {
          isAdmin: roles.includes("admin"),
          isMerchant: roles.includes("merchant")
        };
      }
      
      return { isAdmin: false, isMerchant: false };
    } catch (error) {
      console.error("Error checking user role:", error);
      return { isAdmin: false, isMerchant: false };
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Get existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const roles = await checkUserRole(session.user.id);
            if (isMounted) {
              setIsAdmin(roles.isAdmin);
              setIsMerchant(roles.isMerchant);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Use setTimeout to avoid potential deadlock
            setTimeout(async () => {
              const roles = await checkUserRole(session.user.id);
              if (isMounted) {
                setIsAdmin(roles.isAdmin);
                setIsMerchant(roles.isMerchant);
              }
            }, 0);
          } else {
            setIsAdmin(false);
            setIsMerchant(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out API error:', error);
    }
    // Always clear state even if API call fails
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsMerchant(false);
    // Clear all auth-related storage to ensure clean logout in PWA
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    // Force hard navigation to bypass service worker cache
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isMerchant, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
