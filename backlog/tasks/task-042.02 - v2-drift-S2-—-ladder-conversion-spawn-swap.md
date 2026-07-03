---
id: TASK-042.02
title: v2 drift S2 — ladder conversion + spawn swap
status: Done
assignee: []
created_date: '2026-07-02 04:52'
updated_date: '2026-07-03 00:19'
labels:
  - claude-generated
  - v2
  - physics
milestone: v2
dependencies:
  - TASK-042.01
parent_task_id: TASK-042
priority: high
ordinal: 33010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ladder conversion + spawn swap (drift rewrite slice S2/4; umbrella task-042). Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md §S2. Spec: docs/superpowers/specs/2026-07-01-drift-physics-design.md §§1 (poses = rope + repel jointly), 3.3 (poses + parkGapPx; radial wiring already landed in S1), 3.4 (all), 3.5 (all, per plan adjustment 1). Size M.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Read spec §§1, 3.3, 3.4, 3.5 before starting — no other context.
- [x] #2 Dismissal = slight random fling + fade-out, removal on fade-end; viewport-clearance detection (`CLEAR_PAD`) deleted. [spec §3.4]
- [x] #3 `PeekStore` phase renamed `'dismissing'`; zero `'falling'` hits in src + tests. [spec §3.4, §3.8]
- [x] #4 Cards spawn at layout anchor with small random velocity; the full §3.5 10-file spawnOffset sweep is deleted in this same slice. [spec §3.5]
- [x] #5 Parked + word-anchored poses produced by rope + repel jointly (V2.3 smoke evidence). [spec §1, §3.3]
- [x] #6 Ambient-pin default offset (`ambientPins.ts`) and root-pin fallback (`PinnedCard.tsx` :127-131) converted to authored near-word, any-direction offsets (`ambientPins.test.ts` rewritten; V2.4 evidence); `pinTuning.parkGapPx` reinterpreted as park-rope rest clearance. [spec §3.3]
- [x] #7 `peekTuning` knobs re-semanticized in place (`fadeMs`, `dismissKick`); dismissal knobs live ONLY in `peekTuning`. [spec D7]
- [x] #8 Full verify gate + grep sweep clean (V2.1, V2.5).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S2 drift ladder + spawn swap — §3.4 dismissal (isotropic random fling + fade, remove on fade-end, CLEAR_PAD deleted, phase falling→dismissing), §3.5 spawn (at anchor + driftScale-scaled kick; 10-file spawnOffset sweep deleted; Atelier guards green), §3.3 poses (ambient/Home/root-pin offsets de-gravitied; parkGapPx reinterpreted; pose = S1 repel+rope). Verify gate green: typecheck + 804 tests + build/prerender + in-browser smoke (portal & pocket dwell→dismiss = fling+fade to opacity 0 + removal at ~fadeMs; home ambient pin floats clear; zero console/errors) + secret-scan + grep sweep (spawnOffset & peek-phase 'falling' zero). AC#3: peek-phase 'falling' is zero; residual bare-word 'falling' hits (6 dormant-gravity physics test descriptions + RouteAnnouncer 'falling back' idiom) are pre-existing/untouched by this branch and triaged unrelated — TRIAGE ACCEPTED by Chai. DoD#3 N/A (drift dismissal/spawn language already in CONTEXT.md). DoD#7 modest adversarial-review wf_5b9dc396: 1 refuted (spawn-kick driftScale-scaling — 2-1 split adjudicated sound vs source), 1 fixed (③ dismiss removal timer anchored to fade-start, 06814d9), 2 LOW pinned to task-042.04 (NaN-margin guard + entrance-snap). Deviations: spawn kick ∝ driftScale via getDriftScale() (reduced-motion-safe); fadeMs=280/dismissKick=8 placeholders (S4 tunes).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
- [x] #7 Pre-merge review gate: run Workflow adversarial-review args={mode:"modest", task:"task-042.02", diffRange:"main...HEAD", specSections:"spec §§1 (poses = rope + repel), 3.3, 3.4, 3.5"} after the verify gate; relay ALL confirmed/adjudication findings verbatim (never self-dismiss); fixes wait for user word
<!-- DOD:END -->
