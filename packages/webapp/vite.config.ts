import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pwaConditionalPlugin from './vite/pwa-conditional-plugin'
import injectAppState from './vite/inject-app-state'

const proxyTarget = process.env.GALLERY_SERVER_URL || 'http://localhost:3000';
const serverUrls = [
  '/api',
  '/files'
]

const proxy = Object.fromEntries(serverUrls.map(prefix => [prefix, {
  target: proxyTarget,
  changeOrigin: true,
  secure: false,
}]))

export default defineConfig(() => {
  return {
    base: '',
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'logo.svg'],
        // All urls are relative to the manifest url so that the app stays
        // installable when the gallery is served below a server.prefix. The id
        // is omitted on purpose: it would resolve against the origin and not
        // the manifest url. Without it the id falls back to the start_url which
        // keeps two galleries on the same host apart
        manifest: {
          name: 'HomeGallery App',
          short_name: 'HomeGallery',
          description: 'All personal photos in your pocket',
          start_url: './',
          scope: './',
          display: 'fullscreen',
          orientation: 'any',
          theme_color: '#000000',
          background_color: '#eee',
          icons: [
            {
              src: 'favicon.ico',
              type: 'image/x-icon',
              sizes: '64x64 32x32 24x24 16x16'
            },
            {
              src: 'logo192.png',
              type: 'image/png',
              sizes: '192x192'
            },
            {
              src: 'logo512.png',
              type: 'image/png',
              sizes: '512x512'
            },
            {
              src: 'logo.svg',
              type: 'image/svg+xml',
              sizes: '512x512'
            }
          ]
        },
        workbox: {
          navigateFallbackDenylist: [/\/api\//, /\/files\//],
          // The image previews are addressed by the checksum of their media and
          // never change, so a cached file is always valid. The browser cache
          // holds them for the two days of the server and drops them by its own
          // strategy, the service worker keeps them until its budget is reached:
          // a revisited list paints from the cache and an installed app shows
          // its thumbnails offline.
          //
          // The entries cover the previews of the thumbnails and of the media
          // view, whose sizes are configured by extractor.image.previewSizes. A
          // budget of 3000 files is a few hundred megabytes at the usual sizes
          // and is purged as a whole if the storage quota of the browser is hit.
          // The video previews are left out: they are large and are requested in
          // ranges, which a cache first strategy would not serve
          runtimeCaching: [
            {
              urlPattern: ({url}) => /\/files\/.*image-preview-\d+\.jpg$/.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'gallery-image-previews',
                expiration: {
                  maxEntries: 3000,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                  purgeOnQuotaError: true
                },
                cacheableResponse: {
                  statuses: [200]
                }
              }
            }
          ]
        }
      }),
      pwaConditionalPlugin({ disabled: false }),
      injectAppState({
        // See gallery.config-example.yml for all available options
        disabled: false,
        state: {
          sources: [
            // enable downloadable sources
            //{ indexName: "Camera roll", downloadable: true }
          ]
        }
      })
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.json']
    },
    server: {
      proxy
    },
  };
});
