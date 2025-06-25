import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "url";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "og-logo-jpg",
        "og-logo.jpg",
        "robots.txt",
        "og-logo.jpg",
      ],
      manifest: {
        name: "Aris Chat",
        short_name: "ArisChat",
        description:
          "Connect with confidence using ArisChat. Encrypted chats, sleek interface, lightning speed. Your world, one message away.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "og-logo.jpg",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "og-logo.jpg",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "og-logo.jpg",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
