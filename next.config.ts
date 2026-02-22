import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Cache de páginas do App (Network First - sempre tenta buscar atualização)
      urlPattern: /^https:\/\/.*\/$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        },
      },
    },
    {
      // Cache de assets estáticos (Cache First - altamente performático)
      urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        },
      },
    },
    {
      // Cache de chamadas ao Supabase (Stale While Revalidate - resposta rápida com atualização em background)
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "supabase-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutos
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
