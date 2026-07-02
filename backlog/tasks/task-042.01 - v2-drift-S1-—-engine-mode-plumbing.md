---
id: TASK-042.01
title: v2 drift S1 — engine + mode plumbing
status: To Do
assignee: []
created_date: '2026-07-02 04:51'
updated_date: '2026-07-02 04:52'
labels:
  - claude-generated
  - v2
  - physics
milestone: v2
dependencies: []
parent_task_id: TASK-042
priority: high
ordinal: 32010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Engine + mode plumbing (drift rewrite slice S1/4; umbrella task-042). Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md §S1. Spec: docs/superpowers/specs/2026-07-01-drift-physics-design.md §§1, 3.1, 3.2 (all except route-file gravity: drops), 3.3 (radial edge wiring only, both call sites), D7. Size L.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Read spec §§1, 3.1, 3.2, 3.3 (radial rule), D7 before starting — the executing session has no other context.
- [ ] #2 With no `mode` declared, every route runs drift: engine gravity `{x:0,y:0}` + drift force pass active (unit + smoke evidence). [spec §3.1, §3.2]
- [ ] #3 Invariance tests green: dt-normalized, mass-invariant, deterministic under injected RNG; plus the drift-settle bounded-drift invariant test. [spec §1, §3.8]
- [ ] #4 A route-declared `driftScale` scales wander amplitude (test); default 1 when absent — the plumbing must reach the §1 apply site. [spec §1, §3.2]
- [ ] #5 Damping, BOTH halves: bodies register `frictionAir = driftTuning.damping` under drift and `BODY_FRICTION_AIR` under `mode:'gravity'`; the drift tick re-syncs `body.frictionAir` from `driftTuning` (test evidence). [spec §1 damping row, §3.1]
- [ ] #6 Prose-repel falloff finite + outward everywhere incl. corners and inside-rect (test). [spec §1, §3.8]
- [ ] #7 Dormant gravity subset green under `mode:'gravity'` (V1.2). [spec §3.1]
- [ ] #8 Word-anchor proxies register as sensors; no collision impulse from proxy overlap (test). [spec §3.1]
- [ ] #9 Drift-mode anchor moves translate-pair (wander offset + velocity preserved), never teleport-and-zero (test). [spec §3.1, D4]
- [ ] #10 Radial edge wiring at BOTH call sites: `wireTetherFor` cases in `Tether.test.ts` AND a parkAt-level test driving `PinnedCard` through auto-park, asserting attach point + radial length (the `wireTetherFor` cases do NOT cover `parkAt`'s inline duplicate). [spec §3.3, §3.8]
- [ ] #11 Atelier layout write-back round-trips gravity-less layouts (V1.4). [spec §3.2]
- [ ] #12 Full verify gate + grep sweep clean (V1.1, V1.6).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md (§S1 — read its "Spec claims this slice load-bears on" list at execution). Spec (RATIFIED 2026-07-01, frozen): docs/superpowers/specs/2026-07-01-drift-physics-design.md. Blocked by: none — first slice. Branch: feat/task-042.01-drift-engine off fresh main. Slices merge serially S1→S2→S3→S4; no wave.
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
