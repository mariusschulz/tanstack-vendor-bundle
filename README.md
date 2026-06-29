# TanStack Start — vendor chunk not emitted

Minimal reproduction showing that **TanStack Start's client build does not honor
`manualChunks` / `codeSplitting`**, so React (and other `node_modules`) cannot
be split into a separate long-lived `vendor` chunk.

Related discussion: https://github.com/TanStack/router/discussions/7712

## Reproduce

```sh
pnpm install
pnpm build
ls dist/client/assets
```

## Expected vs actual

`vite.config.ts` puts a `manualChunks` group on the **client** environment that
routes every `node_modules` module into a `vendor` chunk:

```ts
environments: {
  client: {
    build: {
      rolldownOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/')) return 'vendor'
          },
        },
      },
    },
  },
}
```

**Expected** — a vendor chunk is emitted:

```
dist/client/assets/index-*.js     (small app code)
dist/client/assets/vendor-*.js    (React + ReactDOM + router)
```

**Actual** — no vendor chunk; React stays in the single entry chunk:

```
dist/client/assets/routes-*.js      0.13 kB
dist/client/assets/index-*.js     315.57 kB   ← React is bundled here
```

## Why this looks like a bug

- The same `manualChunks` / `codeSplitting` / `advancedChunks` config **does**
  emit a `vendor-*.js` chunk in a plain rolldown-vite app (no TanStack Start).
- The callback **is invoked** and returns `"vendor"` for every `node_modules`
  module (verify by adding a `console.log` inside `manualChunks`), yet a
  `renderChunk` hook shows rolldown only ever creates the entry chunk plus lazy
  route chunks — the `vendor` chunk is **never created** (it is not merged away
  later; it is simply not produced).
- It only fails once `tanstackStart()` is in the plugin pipeline.
