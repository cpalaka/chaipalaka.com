---
id: TASK-037
title: v2 — WebGPU boot spike (R3F 9.6.1 + three/webgpu under the pins)
status: To Do
assignee: []
created_date: '2026-06-21 19:39'
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
- [ ] #1 Client-only, lazy-chunked route mounts an R3F 9.6.1 <Canvas> backed by WebGPURenderer (async-gl factory + extend(three/webgpu)) and renders at least one TSL node-material frame
- [ ] #2 In a real WebGPU browser the route confirms renderer.backend.isWebGPUBackend === true (proves the WebGPU path, not the silent WebGL2 auto-fallback) and surfaces adapter info; verified via screenshot
- [ ] #3 npm run build green: data-server-rendered present in dist/index.html AND the three/webgpu chunk is lazy-split (absent from index.html modulepreload set) — reading-route initial payload unaffected
- [ ] #4 No-WebGPU path is graceful: typecheck + test + build green, no SSG/prerender crash, falls to the existing static (PNG/gradient) fallback when navigator.gpu or the adapter is absent
- [ ] #5 Spike conclusion recorded: ADR (WebGPU-exclusive viability under the pins) + DRAFT-009 updated; finding propagated to dependent threejs ideas
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
