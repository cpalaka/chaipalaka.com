---
id: TASK-037
title: v2 — WebGPU boot spike (R3F 9.6.1 + three/webgpu under the pins)
status: Done
assignee: []
created_date: '2026-06-21 19:39'
updated_date: '2026-06-21 20:27'
labels:
  - claude-generated
  - threejs
  - spike
milestone: v2
dependencies: []
priority: high
ordinal: 27010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Gating spike for DRAFT-009's WebGPU-exclusive direction (see [[project-webgpu-exclusive-direction]]). Minimal boot-only: prove @react-three/fiber 9.6.1 can stand up a three WebGPURenderer under the vite-react-ssg pins, render a TSL node-material frame, and confirm the WebGPU backend actually engages (not the silent WebGL2 fallback). Port cost of the 9 existing GLSL scenes is OUT of scope (they are disposable placeholders). All 3 spike-blockers were pre-verified green (factcheck workflow 2026-06-21): R3F async-gl mount API, three/webgpu SSR-safety, and the repo's existing client-only+lazy isolation pattern. This spike is the empirical in-repo + real-browser confirmation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Client-only, lazy-chunked route mounts an R3F 9.6.1 <Canvas> backed by WebGPURenderer (async-gl factory + extend(three/webgpu)) and renders at least one TSL node-material frame
- [x] #2 In a real WebGPU browser the route confirms renderer.backend.isWebGPUBackend === true (proves the WebGPU path, not the silent WebGL2 auto-fallback) and surfaces adapter info; verified via screenshot
- [x] #3 npm run build green: data-server-rendered present in dist/index.html AND the three/webgpu chunk is lazy-split (absent from index.html modulepreload set) — reading-route initial payload unaffected
- [x] #4 No-WebGPU path is graceful: typecheck + test + build green, no SSG/prerender crash, falls to the existing static (PNG/gradient) fallback when navigator.gpu or the adapter is absent
- [x] #5 Spike conclusion recorded: ADR (WebGPU-exclusive viability under the pins) + DRAFT-009 updated; finding propagated to dependent threejs ideas
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PASSED. R3F 9.6.1 boots a three WebGPURenderer under the vite-react-ssg pins via the async-gl factory; isWebGPUBackend===true (adapter apple/metal-3), TSL node-material renders, SSG-safe + lazy-chunked, zero new dep / no version bump. three/webgpu coverage ~82% (not ~95%) so static PNG is a first-class fallback. Decision recorded in ADR-0009; DRAFT-009 re-tiered. Throwaway /test/webgpu route removed after sign-off (net diff = docs + board only). Compute half (atomics/storage/readback) still needs a separate spike.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
