---
id: TASK-042
title: v2 — top-down drift graph physics (replace gravity model)
status: Done
assignee: []
created_date: '2026-06-21 21:56'
updated_date: '2026-07-03 05:47'
labels:
  - claude-generated
  - v2
  - physics
  - foundational
  - high-priority
milestone: v2
dependencies: []
documentation:
  - docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GOAL: replace the gravity-based matter.js model with a TOP-DOWN drift graph — cards drift gently on a 2D plane, draggable + collidable; tethers are pull-only rope graph-edges.

STATUS (2026-07-01): **GRILLED + SPEC RATIFIED.** Full grilling session (8 branches, all resolved) + 46-agent adversarial review (16 confirmed + 8 LOW findings applied; 2 review-reopened items resolved by Chai). Authoritative design: `docs/superpowers/specs/2026-07-01-drift-physics-design.md` + ADR-0010 (ADR-0001 superseded in part). CONTEXT.md + PRD updated in the same commit.

PRIORITY: HIGH / FOUNDATIONAL — the foundation for the canvas auras (task-038), fat-line tethers (task-039), field-warp (task-041), and the broader v2 art direction. (Set real HIGH priority + v2 milestone when promoting.)

THE 7 OPEN QUESTIONS — RESOLVED (details + rationale in the spec):
1. Edge dynamics → real pull-only rope forces (existing `Tether.applyRopeForces` unchanged); no push-apart; no force-directed layout.
2. Resting → edge-only drift, NO home anchors (no-spring-back upheld); layout seeds initial positions + rest lengths (static-edge parents become radial); "drift-settle" = a bounded-drift invariant, never a rest state.
3. peek/keep/enter → survive; `scrollRegime` unchanged; parked/word poses = rope + prose repel jointly; peek dismissal = slight random fling + fade (future "melt" replaces the fade); ENTER/hero-morph untouched.
4. Card states → STRUNG/DETACHED names kept; consequences = bounded drift vs free wander (stays where left; resize translate-pairs, never teleports).
5. Boundaries → viewport walls stay as drift bounds; box edges stay non-colliding sensors + park handles; NEW **Prose repel** on all non-dragged bodies.
6. Engine → matter.js retained (config, not surgery); dt-normalized mass-invariant Brownian via applyForce; frictionAir mode-conditional (0.005 dormant / driftTuning under drift).
7. Tuning → new `physics/driftTuning.ts` read-at-use; `driftScale` on PageSpec (reduced-motion ⇒ 0); dismissal knobs stay in peekTuning (renamed); 9 physicsTuning fossils deleted (4-file sweep); no Atelier drift axis in v1.

SCOPE RATIFIED: every route converts (drift = universal default); gravity kept DORMANT in-engine (per-route Physics mode 'drift'|'gravity'); `sandbox/Strings.tsx` deleted; `test/Box`+`BoxB` kept + converted (the ladder & nested-cards demo); 404 up-gravity joke retires; ADR-0008 reduced-motion pin freeze unchanged.

NEXT: promote to task(s) + decomposition — NEEDS EXPLICIT GO (sequencing sketch = spec §7: engine slice → ladder conversion → rendering/cleanup → route conversion + solo feel pass). Unblocks task-038/039/041 when built.

Prototypes that informed this: prototypes/lava-metaball.html + prototypes/fat-tethers.html (hand-rolled top-down drift integrators; feel pre-validated ~60fps).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CLOSEOUT 2026-07-03: v2 top-down drift graph physics COMPLETE — all 4 sub-slices Done + squash-merged to main. S1 (6db63c0 engine+mode), S2 (2346229 ladder+spawn), S3 (7e48a05 rendering+cleanup), S4 (d591291 route conversion + run-and-tumble feel pass). The gravity-hang model is replaced by drift on every route (dormant gravity retained). Final wander model = RUN-AND-TUMBLE (rare per-card impulse → straight glide, not the Brownian per-frame tremble). Gate-lift notes pinned onto task-038 (auras) + task-041 (field-warp); task-039 already carried the tension note. Spec: docs/superpowers/specs/2026-07-01-drift-physics-design.md + ADR-0010.
<!-- SECTION:NOTES:END -->
