import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

const QUEUE_KEY = "offline-action-queue";

export function useOfflineSync() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(QUEUE_KEY);
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error("Failed to parse offline queue:", e);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      syncQueue();
    }
  }, [isOnline, queue.length]);

  const addToQueue = useCallback((type: string, payload: unknown) => {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
    };
    setQueue((prev) => [...prev, action]);
    
    if (!navigator.onLine) {
      toast({
        title: "تم الحفظ للمزامنة",
        description: "سيتم تنفيذ الإجراء عند عودة الاتصال",
      });
    }
    
    return action.id;
  }, []);

  const removeFromQueue = useCallback((actionId: string) => {
    setQueue((prev) => prev.filter((action) => action.id !== actionId));
  }, []);

  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    let successCount = 0;

    try {
      for (const action of queue) {
        try {
          // Process each action based on type
          await processAction(action);
          removeFromQueue(action.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }

      if (successCount > 0) {
        toast({
          title: "تمت المزامنة",
          description: `تم تنفيذ ${successCount} إجراء(ات) محفوظة`,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [queue, isSyncing, removeFromQueue]);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    syncQueue,
    isSyncing,
    isOnline,
    pendingCount: queue.length,
  };
}

// Process different action types
async function processAction(action: QueuedAction): Promise<void> {
  switch (action.type) {
    case "ADD_TO_FAVORITES":
      // Handle favorite sync
      const { supabase } = await import("@/integrations/supabase/client");
      const favPayload = action.payload as { productId: string; userId: string };
      await supabase.from("favorites").insert({
        product_id: favPayload.productId,
        user_id: favPayload.userId,
      });
      break;

    case "REMOVE_FROM_FAVORITES":
      const { supabase: sb } = await import("@/integrations/supabase/client");
      const removeFavPayload = action.payload as { productId: string; userId: string };
      await sb.from("favorites").delete()
        .eq("product_id", removeFavPayload.productId)
        .eq("user_id", removeFavPayload.userId);
      break;

    // Add more action types as needed
    default:
      console.log("Unknown action type:", action.type);
  }
}

// Create a global sync context
import { createContext, useContext, ReactNode } from "react";

interface OfflineSyncContextType {
  addToQueue: (type: string, payload: unknown) => string;
  pendingCount: number;
  isSyncing: boolean;
  isOnline: boolean;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const sync = useOfflineSync();

  return (
    <OfflineSyncContext.Provider
      value={{
        addToQueue: sync.addToQueue,
        pendingCount: sync.pendingCount,
        isSyncing: sync.isSyncing,
        isOnline: sync.isOnline,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSyncContext() {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error("useOfflineSyncContext must be used within OfflineSyncProvider");
  }
  return context;
}
