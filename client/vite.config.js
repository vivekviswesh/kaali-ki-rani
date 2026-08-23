import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: [],
        runtimeCaching: [
          {
            urlPattern: /^https?.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'network-first-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400 // 1 day
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Kaali Ki Rani Card Game',
        short_name: 'Kaali Ki Rani',
        description: 'Bidding and trick-taking partnership card game with a secret partner.',
        theme_color: '#022c22',
        background_color: '#020617',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});
