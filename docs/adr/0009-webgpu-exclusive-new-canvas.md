# ADR 0009: WebGPU/TSL is the exclusive renderer for new canvas work

**Date:** 2026-06-21
**Status:** Accepted (renderer-integration spike verified; new-canvas direction)
**Task:** task-037 (spike) · idea inventory: `backlog/drafts/draft-009`
**Relates to:** ADR-0004 (no-JS fallback), ADR-0008 (progressive-enhancement floor)

---

## Context

DRAFT-009 (the three.js expansion inventory) is organised around one fault line:
**WebGL2 (today's pinned renderer) vs WebGPU.** Every render trick ships on the
pinned `three@0.184` + `@react-three/fiber 9.6.1`; every genuinely-novel *compute*
idea is WebGPU-only. Two facts changed the calculus: (1) the 9 current ambient
background scenes are **disposable placeholders** (to be replaced wholesale in the
final design), so their GLSL→TSL port cost is a non-factor; (2) Chai wants a
forward-looking art site and chose to build new canvas work on WebGPU.

The one unverified gate was: **can R3F 9.6.1 stand up a `WebGPURenderer` under the
`vite-react-ssg` pins?** task-037 was a minimal boot-only spike to answer it.

## Decision

1. **All NEW canvas / three.js work targets `WebGPURenderer` + TSL exclusively.**
   There is no WebGL2 baseline for the *live* canvas; new scenes are authored as
   TSL node-materials from scratch (not ported GLSL).
2. **The prerendered-PNG + CSS-gradient fallback is a designed, first-class path**
   for the ~18% of visitors without WebGPU — not a token edge case. Gate on
   `navigator.gpu` **and** a successful `requestAdapter()` (the object can exist
   while the adapter returns null), render the static fallback otherwise.
3. **No new dependency, no version bump:** `three/webgpu` + `three/tsl` ship inside
   the pinned `three@0.184`. Keep them behind the existing lazy route chunk +
   client-only mount (the `BackgroundCanvas` Mode-gate / `vite-react-ssg`
   `ClientOnly` pattern) so reading routes stay clean and SSG never constructs a
   renderer.

## Why

Dependency-free, and the spike proved feasibility end-to-end under the real pins
(see below). A WebGL2 fallback for the live canvas would mean maintaining two
renderers (WebGPURenderer rejects `ShaderMaterial`/`RawShaderMaterial`/
`onBeforeCompile`, so there is no shared shader path) to serve a shrinking minority
— the static fallback already covers them and aligns with ADR-0004/0008.

## Verified facts (task-037 spike + factcheck workflow, 2026-06-21, high confidence)

- **R3F 9.6.1 mounts a `WebGPURenderer`** via the v9 async-`gl` factory:
  `gl={async (props) => { const r = new WebGPURenderer(props); await r.init(); return r }}`.
  No version bump; `extend(three/webgpu)` only needed if using node-material *JSX
  elements* (the spike attached the material imperatively and skipped it).
- **Backend actually engages:** the spike route reported `isWebGPUBackend === true`
  (adapter `apple / metal-3`) and rendered a TSL uv-gradient cube at 1600+ frames,
  no console errors — i.e. WebGPU, not the silent WebGL2 auto-fallback.
- **`three/webgpu` / `three/tsl` are SSR-safe at import** (all browser-global access
  is `typeof`-guarded / inside class methods); only renderer *construction/init*
  must stay client-side. The `/test/webgpu` route prerendered cleanly
  (`data-server-rendered` present).
- **Lazy isolation works:** the full `three/webgpu` build (612 KB) landed in the
  route's own chunk; **zero** WebGPU references in the Home `index.html` payload.
- **Coverage is ~82%, not ~95%** (caniuse mid-2026): ~18% lack WebGPU, dominated by
  **in-app webviews** (WKWebView / Android WebView never default-on), pre-iOS-26
  Safari, Firefox on Linux/Android/Intel-Mac, most Chrome-on-Linux.

## Trade-offs

- **~1-in-5 visitors (mobile/social-referral-skewed) get the static fallback**, never
  the live canvas. Accepted for a personal art site.
- **Compute ideas are not yet unblocked by this ADR.** This settles the *renderer
  integration* question. The compute half (storage buffers, atomics, `getArrayBufferAsync`
  readback — DRAFT-009 #26 murmuration, #4 tether-current) needs a *separate*
  compute-capability spike before those are buildable.

## Consequences

- The spike route `web/src/routes/test/Webgpu.tsx` (+ its `/test/webgpu` entry in
  `App.tsx`) is throwaway scaffolding — keep until sign-off, then decide keep-as-
  reference vs delete (DoD#4).
- DRAFT-009's "re-tier after the spike" note is resolved: the WebGL2/WebGPU column is
  moot for new work (everything new is TSL); ideas keep their effort/identity tiers.
