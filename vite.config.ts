import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Qfifat DZ - الحرف اليدوية الجزائرية",
        short_name: "Qfifat DZ",
        description: "منصة بيع القفيفات الحرفية الجزائرية ومستلزمات التجار",
        theme_color: "#1a7a4c",
        background_color: "#FDFBF7",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "ar",
        dir: "rtl",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        screenshots: [
          {
            src: "/screenshot-1.png",
            sizes: "1080x1920",
            type: "image/png",
            form_factor: "narrow"
          }
        ],
        categories: ["shopping", "lifestyle"],
        shortcuts: [
          {
            name: "تصفح المنتجات",
            short_name: "المنتجات",
            url: "/products",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "سلة التسوق",
            short_name: "السلة",
            url: "/cart",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Skip caching for API, auth, and admin routes
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/admin/],
        // Force new service worker to take control immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clean old caches on update
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // API requests - ALWAYS go to network, no caching
            urlPattern: /\/api\/supabase\.php.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\/rest\/v1\/.*/i,
            handler: "NetworkOnly",
          },
          {
            // Images - cache but revalidate
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
