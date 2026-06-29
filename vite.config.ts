import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

// Goal: split all node_modules (React, ReactDOM, the router, ...) into a
// separate, long-lived `vendor` chunk in the CLIENT build.
//
// The chunking config is placed on the `client` environment — this is required,
// because TanStack Start drives separate `client` and `ssr` builds and a
// top-level `build.rollupOptions` is shadowed for the browser bundle.
//
// EXPECTED: dist/client/assets/ contains a `vendor-*.js` chunk.
// ACTUAL:   no vendor chunk — React stays in the single ~316 kB `index-*.js`.
//
// The same config produces a `vendor-*.js` in a plain rolldown-vite app; it only
// fails once `tanstackStart()` is in the plugin pipeline. The `manualChunks`
// callback IS invoked and returns "vendor" for every node_modules module, yet
// rolldown never emits the chunk.
//
// See README.md and https://github.com/TanStack/router/discussions/7712
export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
  environments: {
    client: {
      build: {
        rolldownOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('/node_modules/')) {
                return 'vendor'
              }
            },
          },
        },
      },
    },
  },
})
