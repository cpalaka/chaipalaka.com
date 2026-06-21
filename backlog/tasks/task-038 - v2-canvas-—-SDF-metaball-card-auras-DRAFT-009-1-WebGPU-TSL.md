---
id: TASK-038
title: 'v2 canvas — SDF metaball card auras (DRAFT-009 #1, WebGPU/TSL)'
status: To Do
assignee: []
created_date: '2026-06-21 21:28'
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
- [ ] #1 Aura scene mounts a WebGPURenderer on the top-down graph route via the task-037 async-gl factory; isWebGPUBackend===true verified; SSG prerenders clean (no renderer constructed server-side)
- [ ] #2 One-way physics->shader bridge: >=12 card body.position values snapshot into a TSL uniform array each frame via a shared ref; NO GPU->CPU readback
- [ ] #3 SDF uses smin; neighboring cards visibly merge/split with proximity; blend k + aura thickness live as tunable constants in a read-at-use module, NOT the physics schema (physicsTuning whole-file-regen gotcha)
- [ ] #4 Static PNG + CSS-gradient fallback for no-WebGPU (gate on navigator.gpu AND requestAdapter()), baked through the same look
- [ ] #5 Mercury/ink palette (not warm/kitsch); reads on-brand against IBM-Plex
- [ ] #6 Box-occlusion resolved — runs on a box-less route OR a dedicated above-box layer; decision recorded (ADR if load-bearing)
- [ ] #7 Fill-rate budgeted (half-res ok, capped march steps, <=~12 primitives); holds target fps on the low-power target
- [ ] #8 Visual verification: agent-browser screenshot in main session showing live gloop-merge (assert the proximity->merge invariant, not a single frame)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prototype: prototypes/lava-metaball.html (verified defaults k~46, aura~34, mercury palette). Cross-refs: DRAFT-009 #1 (this) + #3 (sibling tethers task), ADR-0009 (WebGPU-exclusive), task-037 (boot spike). Plus fat-line tethers sibling = task-039 if created.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
