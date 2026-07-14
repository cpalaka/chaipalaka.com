---
id: TASK-038
title: 'v2 canvas — SDF metaball card auras (DRAFT-009 #1, WebGPU/TSL)'
status: Done
assignee: []
created_date: '2026-06-21 21:28'
updated_date: '2026-07-14 21:15'
labels:
  - claude-generated
  - threejs
  - webgpu
  - v2
  - canvas
milestone: v2
dependencies: []
ordinal: 28010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Render each card's matter.js body as a smin-blended SDF 'aura' so neighboring cards gloop into one mercury body and split as they drift apart — the 'physics made visible' / two-RAF-loops-talk idea (DRAFT-009 #1). WebGPU/TSL EXCLUSIVE per ADR-0009; authored as a TSL node-material from scratch (no GLSL port). Companion: DRAFT-009 #3 fat-line tethers is a SEPARATE sibling task — division of labor is SDF owns the masses, Line2 owns the edges (do NOT make the SDF render tension-legible ropes).

DEPENDENCY (tracked by Chai, not a board task): gated on the top-down-drift physics rewrite — gravity gives way to gentle drift on a plane, cards draggable + collidable, no gravity. Top-down drift is the native habitat for this effect (reframe lava-lamp -> ferrofluid/cells), which is why it is sequenced after the rewrite. Do not start this task until that rewrite has landed.

KEY FINDING that de-risks the task: #1 is NOT compute-gated. The physics->shader bridge is ONE-WAY — snapshot body.position into a TSL uniform array each frame via a shared ref; no getArrayBufferAsync readback. It rides entirely on what task-037 already proved. (Contrast #4 tether-current / #26 murmuration, which need the separate, still-OPEN compute spike.)

PROTOTYPE (verified 2026-06-21, agent-browser, 59fps): prototypes/lava-metaball.html — throwaway GLSL that confirms look + feel. The smin blend 'k' is the dominant feel knob (sweet spot ~40-50, narrow); mercury/ink palette reads on-brand, warm reads as kitsch. NOTE: prototypes/ is throwaway scratch, not the WebGPU/TSL app.

HARD PARTS: fill-rate (per-pixel march x proximity loop -> half-res + capped steps/primitives); smin k tuning; TSL raymarch authoring ergonomics vs GLSL; box-occlusion on reading routes (-> box-less /lab or toy route, or an above-box layer). For a top-down plane, 2D-field-with-faked-normal is the right technique (cheaper, looks ~identical to a 3D sphere-trace).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Aura scene mounts a WebGPURenderer on the top-down graph route via the task-037 async-gl factory; isWebGPUBackend===true verified; SSG prerenders clean (no renderer constructed server-side)
- [x] #2 One-way physics->shader bridge: >=12 card body.position values snapshot into a TSL uniform array each frame via a shared ref; NO GPU->CPU readback
- [x] #3 SDF uses smin; neighboring cards visibly merge/split with proximity; blend k + aura thickness live as tunable constants in a read-at-use module, NOT the physics schema (physicsTuning whole-file-regen gotcha)
- [x] #4 Static PNG + CSS-gradient fallback for no-WebGPU (gate on navigator.gpu AND requestAdapter()), baked through the same look
- [x] #5 Mercury/ink palette (not warm/kitsch); reads on-brand against IBM-Plex
- [x] #6 Box-occlusion resolved — runs on a box-less route OR a dedicated above-box layer; decision recorded (ADR if load-bearing)
- [x] #7 Fill-rate budgeted (half-res ok, capped march steps, <=~12 primitives); holds target fps on the low-power target
- [x] #8 Visual verification: agent-browser screenshot in main session showing live gloop-merge (assert the proximity->merge invariant, not a single frame)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Mount = NEW box-less /lab route (Chai-approved 2026-07-13); resolves AC#6 (record decision as ADR). 041 combine-or-pick-one deferred to task-041 AC#1; the S1 bridge is shared with 041.

S1 (opus-implementer): PhysicsWorld.snapshotCardRects(out: Float32Array) -> count (packs cx,cy,halfW,halfH per non-static card body, zero-alloc) + unit tests; canvas/detect-webgpu.ts (navigator.gpu AND requestAdapter, async) + tests; AuraLayer shell (pending/webgpu/fallback mode machine mirroring BackgroundCanvas, reduced-motion -> fallback, lazy scene chunk, CSS-gradient placeholder fallback); /lab route (12 cards, full drift, box-less, NoJsFallback) + App.tsx entry.

S2 (opus-implementer): TSL AuraScene — WebGPURenderer via the ADR-0009 async-gl factory (isWebGPUBackend===true); 2D sdBox+smin field with faked normal + mercury palette re-authored in TSL from prototypes/lava-metaball.html; uniform array fed by snapshotCardRects in useFrame (one-way, NO GPU->CPU readback); auraTuning.ts read-at-use module (defaults k~46 aura~34); half-res + capped steps + <=12 primitives.

S3 (main session, solo): feel pass (verify modulated values at range extremes); agent-browser verification of the proximity->merge invariant (not a single frame); static fallback PNG baked through the same look; full verify gate; docs (ADR for box-occlusion decision, CONTEXT.md, PRD test-roster); adversarial review with user go (proposed: modest).

Orchestration: Fable main loop orchestrates; implementation diffs via opus-implementer (pinned model+effort in agent definition); every handoff re-verified and all gates run in the main loop.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prototype: prototypes/lava-metaball.html (verified defaults k~46, aura~34, mercury palette). Cross-refs: DRAFT-009 #1 (this) + #3 (sibling tethers task), ADR-0009 (WebGPU-exclusive), task-037 (boot spike). Plus fat-line tethers sibling = task-039 if created.

Physics-rewrite dependency is now DRAFT-010 (v2 — top-down drift graph physics, high-priority). Starts only after DRAFT-010 is grilled, promoted, and built.

GATE LIFTED 2026-07-03: task-042 (top-down drift physics) shipped to main (squash d591291; S1–S4 all Done). The per-frame card body positions this task needs (via the shared physics ref / world.getPosition each frame) now exist under the live drift model on every route — spec §4: 'task-038 (auras): per-frame card body positions via shared ref: exists. Gate lifts when this ships.' Drift knobs: driftTuning.{impulseSpeed,impulseIntervalMs,damping}. Ref: docs/superpowers/specs/2026-07-01-drift-physics-design.md §4 + ADR-0010.

S3 (2026-07-13): feel pass fixed color pipeline (flat+linear passthrough; transparent premultiplied compositing like the prototype — no opaque ink backdrop) and added the rotation channel to the bridge (cos/sin per card; axis-aligned ghost-plateau defect found on rotated cards during visual verify). AC#8 verified live: drag-merge then drag-split via synthetic pointer drags, screenshots at both states; reduced-motion -> static fallback verified with confirmed emulation; 61fps at dpr 0.5. Fallback PNG baked from the live canvas at the stilled grid (aligns 1:1 with reduced-motion card positions). AC#5 (palette reads on-brand) + AC#7's low-power-device clause left for Chai's eyes/hardware. Docs: ADR-0011 (mount decision), CONTEXT.md Aura entry, PRD test roster.

Modest adversarial review (all-Opus, 2026-07-14): 1 CONFIRMED MEDIUM + 7 LOW. Fixed in 94b36c4 — MEDIUM: WebGPU init-reject / device-loss / render-throw now degrade to the AC#4 static fallback via a one-way latch (gl-factory try/catch [only catcher of an init() rejection — R3F v9 runs configure({gl}) un-awaited, so a boundary can't see it] + renderer.onDeviceLost + a new web/src/lib/ErrorBoundary); LOW#4: snapshotCardRects now skips dynamic sensors (dismissed previews), matching the drift pass; LOW#2/#7/#3: ADR-0011 fallback-alignment claim softened. ACCEPTED trade-offs (placeholder /lab toy, NOT fixed): #3 mid-session reduced-motion toggle shows the PNG grid while cards froze mid-drift (inherent to any static fallback); #5 maxCards=12 == exact /lab card count == AC#7 fill-rate budget, so a 13th card gets no aura (deliberate); #6 dpr memoized once at mount → wrong resolution after a cross-monitor DPR change until remount (niche, self-heals on route change).

Closed 2026-07-14 on Chai's sign-off ('diff looks good, close it out'). AC#5: mercury reads on-brand (agent-browser screenshot). AC#7: fill-rate budget implemented+verified (half-res dpr 0.5, <=12 primitives, capped field loop, 61fps on dev hardware); the low-power-target fps sub-clause is accepted on the budget basis, NOT measured on dedicated low-power hardware. Squash-merge to main to follow.
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
