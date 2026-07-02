---
id: TASK-042.02
title: v2 drift S2 — ladder conversion + spawn swap
status: To Do
assignee: []
created_date: '2026-07-02 04:52'
updated_date: '2026-07-02 04:52'
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
- [ ] #1 Read spec §§1, 3.3, 3.4, 3.5 before starting — no other context.
- [ ] #2 Dismissal = slight random fling + fade-out, removal on fade-end; viewport-clearance detection (`CLEAR_PAD`) deleted. [spec §3.4]
- [ ] #3 `PeekStore` phase renamed `'dismissing'`; zero `'falling'` hits in src + tests. [spec §3.4, §3.8]
- [ ] #4 Cards spawn at layout anchor with small random velocity; the full §3.5 10-file spawnOffset sweep is deleted in this same slice. [spec §3.5]
- [ ] #5 Parked + word-anchored poses produced by rope + repel jointly (V2.3 smoke evidence). [spec §1, §3.3]
- [ ] #6 Ambient-pin default offset (`ambientPins.ts`) and root-pin fallback (`PinnedCard.tsx` :127-131) converted to authored near-word, any-direction offsets (`ambientPins.test.ts` rewritten; V2.4 evidence); `pinTuning.parkGapPx` reinterpreted as park-rope rest clearance. [spec §3.3]
- [ ] #7 `peekTuning` knobs re-semanticized in place (`fadeMs`, `dismissKick`); dismissal knobs live ONLY in `peekTuning`. [spec D7]
- [ ] #8 Full verify gate + grep sweep clean (V2.1, V2.5).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md (§S2 — read its "Spec claims this slice load-bears on" list at execution). Spec (RATIFIED 2026-07-01, frozen): docs/superpowers/specs/2026-07-01-drift-physics-design.md. Blocked by: task-042.01 (S1 — the radial rule + repel force this slice consumes land there). Branch: feat/task-042.02-drift-ladder off main after task-042.01 merges. Serial merges; no wave.
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
