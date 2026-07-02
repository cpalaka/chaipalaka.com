---
id: TASK-042.01
title: v2 drift S1 — engine + mode plumbing
status: Done
assignee: []
created_date: '2026-07-02 04:51'
updated_date: '2026-07-02 22:17'
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
- [x] #1 Read spec §§1, 3.1, 3.2, 3.3 (radial rule), D7 before starting — the executing session has no other context.
- [x] #2 With no `mode` declared, every route runs drift: engine gravity `{x:0,y:0}` + drift force pass active (unit + smoke evidence). [spec §3.1, §3.2]
- [x] #3 Invariance tests green: dt-normalized, mass-invariant, deterministic under injected RNG; plus the drift-settle bounded-drift invariant test. [spec §1, §3.8]
- [x] #4 A route-declared `driftScale` scales wander amplitude (test); default 1 when absent — the plumbing must reach the §1 apply site. [spec §1, §3.2]
- [x] #5 Damping, BOTH halves: bodies register `frictionAir = driftTuning.damping` under drift and `BODY_FRICTION_AIR` under `mode:'gravity'`; the drift tick re-syncs `body.frictionAir` from `driftTuning` (test evidence). [spec §1 damping row, §3.1]
- [x] #6 Prose-repel falloff finite + outward everywhere incl. corners and inside-rect (test). [spec §1, §3.8]
- [x] #7 Dormant gravity subset green under `mode:'gravity'` (V1.2). [spec §3.1]
- [x] #8 Word-anchor proxies register as sensors; no collision impulse from proxy overlap (test). [spec §3.1]
- [x] #9 Drift-mode anchor moves translate-pair (wander offset + velocity preserved), never teleport-and-zero (test). [spec §3.1, D4]
- [x] #10 Radial edge wiring at BOTH call sites: `wireTetherFor` cases in `Tether.test.ts` AND a parkAt-level test driving `PinnedCard` through auto-park, asserting attach point + radial length (the `wireTetherFor` cases do NOT cover `parkAt`'s inline duplicate). [spec §3.3, §3.8]
- [x] #11 Atelier layout write-back round-trips gravity-less layouts (V1.4). [spec §3.2]
- [x] #12 Full verify gate + grep sweep clean (V1.1, V1.6).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md (§S1 — read its "Spec claims this slice load-bears on" list at execution). Spec (RATIFIED 2026-07-01, frozen): docs/superpowers/specs/2026-07-01-drift-physics-design.md. Blocked by: none — first slice. Branch: feat/task-042.01-drift-engine off fresh main. Slices merge serially S1→S2→S3→S4; no wave.

S1 COMPLETE (drift engine + mode plumbing). Verify gate green: typecheck, 806 tests, build+prerender, smoke (blog-post pin drifts in-browser, no NaN, zero console errors), secret-scan zero. Adversarial-review DoD#7 (full mode) WAIVED by user 2026-07-02, ran modest twice: (1) prior session 6 confirmed + 3 LOW, all fixed (Fix A blog/sandbox drift default; Fix B drift-pass sensor-skip + velocity un-clamp; N1/N2/N4); (2) re-run wf_59596caa-375 with all finders upgraded to Opus 4.8 xhigh = 0 confirmed / 0 adjudication / 5 LOW -- L3 (frictionAir NaN clamp) + L5 (Strings mode-reset cleanup) fixed, L1 (repel x driftScale / D8) + L3 pinned to task-042.04 ACs #10/#11, L2 (wordAnchor.test sweep) + L4 (provider rng determinism) deferred benign. Waiver rationale: Opus-xhigh per-agent depth exceeds full-mode Fable finders and returned clean after all prior findings fixed+re-verified; full's uncovered increment = contract-drift + test-adequacy lenses + critic + synthesis. Unblocks S2 (task-042.02).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
- [x] #7 Pre-merge review gate: run Workflow adversarial-review args={mode:"full", task:"task-042.01", diffRange:"main...HEAD", specSections:"spec §§1, 3.1, 3.2, 3.3 (radial rule), D7"} after the verify gate — full mode projects >20 agents: state the estimate in chat BEFORE launching; relay ALL confirmed/adjudication findings verbatim (never self-dismiss); fixes wait for user word
<!-- DOD:END -->
