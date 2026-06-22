---
id: TASK-040
title: 'v2 canvas — z-layered parallax depth field (DRAFT-009 #15, TSL)'
status: To Do
assignee: []
created_date: '2026-06-22 00:13'
labels:
  - claude-generated
  - threejs
  - webgpu
  - v2
  - canvas
milestone: v2
dependencies: []
ordinal: 30010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Off-axis parallax + depth-of-field on a z-LAYERED background, so flat canvas gains fish-tank depth (DRAFT-009 #15). TWO-PART task: (1) DECIDE what the z-axis layers actually depict (the open design question), then (2) author + implement the depth field on WebGPU/TSL.

CONFIRMED via prototype (prototypes/parallax-peephole.html, ~51-60fps Canvas2D proxy): the effect reads and is renderer-agnostic — setViewOffset is CPU-side camera matrix math, identical on WebGPU (that is the whole point of #15: unaffected by the GL2->TSL shift). Chai's key finding: depth-of-field blur that INCREASES with depth is the dominant 'sells the depth' lever — without it the layers just slide; with it they read as atmosphere. Magnitude must stay small (nausea).

KNOWN ISSUE to fix at build: in the prototype, foreground flecks read SMALLER than deep ones because the DoF blur spreads deep sprites into large soft bokeh while near ones stay crisp — size and blur fight. Fix the size-x-blur hierarchy so near reads larger AND sharper, deep smaller AND blurrier.

SUBSTRATE CANDIDATES for the z-axis (AC#1 decides): (a) abstract flecks/dust (calm but generic); (b) receding TYPOGRAPHY — fragments of prose/letterforms layered into depth, a 'well of words' (most on-identity; ties to the text-first site + the #6->#8 typography family); (c) the drift-graph seen from within — nodes/tethers at depth (closes the two-RAF theme, but COUPLES to DRAFT-010); (d) printmaking marks / halftone at depth (risograph thread).

STRETCH / SPIN-OFF (not core scope): the LITERAL peephole (mode B in the prototype) — frame the depth in an aperture. The CIRCLE is a decorative porthole; the CARD-shaped window is a PORTAL that maps onto the hero-morph 'card expands into a destination' (Theme 3, DRAFT-009 #13/#24). If pursued it likely spins into its own Theme-3 portal task. VT CONSTRAINT to carry: the View Transitions API freezes the old DOM to a static raster mid-morph, so a LIVE WebGL peephole INSIDE the morphing element is impossible — the peephole is the PRE-morph resting state; the transition itself stays the native VT.

NOT gated on DRAFT-010 (render-side, buildable now on the task-037 TSL integration) UNLESS substrate (c) the drift-graph is chosen. Per ADR-0009: WebGPU/TSL exclusive; static-PNG fallback is first-class.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Z-axis substrate DECIDED and recorded (what the layers depict + why); pick from the candidates in the description. If the drift-graph substrate is chosen, note the DRAFT-010 coupling explicitly.
- [ ] #2 Background authored as a WebGPU/TSL scene with N discrete depth layers (per ADR-0009; static-PNG fallback retained for the ~18% no-WebGPU + no-JS).
- [ ] #3 Off-axis parallax via Camera.setViewOffset / off-axis projection, pointer-driven, magnitude clamped (no nausea); renderer-agnostic — verified rendering on WebGPU.
- [ ] #4 Depth-of-field: per-layer blur increases with depth; size-x-blur hierarchy fixed so near reads larger + sharper and deep reads smaller + blurrier (the prototype backward-sizing is gone).
- [ ] #5 On canvas-mode routes, foreground physics cards stay anchored at the glass and the field parallaxes BEHIND them; the depth-separation cue is verified to read.
- [ ] #6 Visual/feel verification: agent-browser pass in the MAIN session confirming parallax MOTION + magnitude (not a single static frame).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prototype: prototypes/parallax-peephole.html (v2 — ambient DoF + circle/card peephole; ~51-60fps Canvas2D proxy for the look only). Rejected sibling from the same walk: prototypes/glyph-rd.html (#6 — see its in-file VERDICT). Cross-refs: DRAFT-009 #15 (+ #13/#24 for the portal stretch, #6->#8 for the typography substrate), ADR-0009, task-037. Real build = setViewOffset/off-axis projection + a per-layer DoF blur pass on the TSL scene.
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
