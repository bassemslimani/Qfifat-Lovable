import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Truck, Package, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrackingPoint {
  id: string;
  status: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  created_at: string;
}

interface OrderTrackingMapProps {
  orderId: string;
  trackingNumber?: string;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoibG92YWJsZS1tYXBzIiwiYSI6ImNtYW5yZ3FjdTBkcnAya3NiNTZ1cWdwNmQifQ.eSJxw0_nLa3nKjLf3A8V8A";

const statusSteps = [
  { status: "pending", label: "قيد الانتظار", icon: Clock },
  { status: "confirmed", label: "تم التأكيد", icon: Package },
  { status: "processing", label: "جاري التجهيز", icon: Package },
  { status: "shipped", label: "تم الشحن", icon: Truck },
  { status: "delivered", label: "تم التسليم", icon: CheckCircle },
];

export default function OrderTrackingMap({ orderId, trackingNumber }: OrderTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingPoint[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackingData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipping_tracking",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Tracking update:", payload);
          fetchTrackingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchTrackingData = async () => {
    try {
      const { data: trackingData, error: trackingError } = await supabase
        .from("shipping_tracking")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (!trackingError && trackingData) {
        setTrackingHistory(trackingData as TrackingPoint[]);
        if (trackingData.length > 0) {
          setCurrentStatus(trackingData[trackingData.length - 1].status);
        }
      }

      // Get order status
      const { data: orderData } = await supabase
        .from("orders")
        .select("status, current_location, latitude, longitude")
        .eq("id", orderId)
        .single();

      if (orderData) {
        setCurrentStatus(orderData.status || "pending");
      }
    } catch (error) {
      console.error("Error fetching tracking:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || trackingHistory.length === 0) return;

    const validPoints = trackingHistory.filter(
      (p) => p.latitude !== null && p.longitude !== null
    );

    if (validPoints.length === 0) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [validPoints[validPoints.length - 1].longitude!, validPoints[validPoints.length - 1].latitude!],
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-left");

    // Add markers for each tracking point
    validPoints.forEach((point, index) => {
      const isLast = index === validPoints.length - 1;
      
      const el = document.createElement("div");
      el.className = `w-8 h-8 rounded-full flex items-center justify-center ${
        isLast ? "bg-primary" : "bg-muted"
      }`;
      el.innerHTML = isLast
        ? '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>'
        : '<span class="w-2 h-2 bg-white rounded-full"></span>';

      new mapboxgl.Marker(el)
        .setLngLat([point.longitude!, point.latitude!])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2 text-right">
              <p class="font-bold">${point.location}</p>
              <p class="text-sm text-gray-600">${point.description || ""}</p>
              <p class="text-xs text-gray-400">${new Date(point.created_at).toLocaleString("ar-DZ")}</p>
            </div>`
          )
        )
        .addTo(map.current!);
    });

    // Draw line between points if multiple
    if (validPoints.length > 1) {
      map.current.on("load", () => {
        map.current!.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: validPoints.map((p) => [p.longitude!, p.latitude!]),
            },
          },
        });

        map.current!.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "hsl(152, 75%, 32%)",
            "line-width": 4,
            "line-opacity": 0.7,
          },
        });
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [trackingHistory]);

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex((s) => s.status === currentStatus);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-card overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">تتبع الشحنة</h3>
          {trackingNumber && (
            <span className="text-sm text-muted-foreground">
              رقم التتبع: {trackingNumber}
            </span>
          )}
        </div>
      </div>

      {/* Status Steps */}
      <div className="p-4 border-b border-border overflow-x-auto">
        <div className="flex items-center justify-between min-w-max gap-2">
          {statusSteps.map((step, index) => {
            const isActive = index <= getCurrentStepIndex();
            const isCurrent = step.status === currentStatus;
            const Icon = step.icon;

            return (
              <div key={step.status} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isActive
                        ? "hsl(152, 75%, 32%)"
                        : "hsl(var(--muted))",
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <span
                    className={`text-xs mt-2 ${
                      isActive ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 rounded ${
                      index < getCurrentStepIndex() ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map */}
      {trackingHistory.some((p) => p.latitude && p.longitude) ? (
        <div ref={mapContainer} className="h-64 md:h-80" />
      ) : (
        <div className="h-64 flex items-center justify-center bg-muted/30">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد معلومات موقع متاحة</p>
          </div>
        </div>
      )}

      {/* Tracking History */}
      <div className="p-4">
        <h4 className="font-medium mb-4">سجل التتبع</h4>
        <AnimatePresence>
          {trackingHistory.length > 0 ? (
            <div className="space-y-3">
              {[...trackingHistory].reverse().map((point, index) => (
                <motion.div
                  key={point.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 items-start"
                >
                  <div
                    className={`w-3 h-3 mt-1.5 rounded-full ${
                      index === 0 ? "bg-primary" : "bg-muted-foreground"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{point.location}</p>
                    {point.description && (
                      <p className="text-sm text-muted-foreground">
                        {point.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(point.created_at).toLocaleString("ar-DZ")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              لا توجد تحديثات تتبع بعد
            </p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
