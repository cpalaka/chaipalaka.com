---
id: TASK-042.04
title: 'v2 drift S4 — route conversion + feel pass (SOLO, in-session)'
status: Done
assignee: []
created_date: '2026-07-02 04:53'
updated_date: '2026-07-03 05:44'
labels:
  - claude-generated
  - v2
  - physics
milestone: v2
dependencies:
  - TASK-042.03
parent_task_id: TASK-042
priority: high
ordinal: 35010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Route conversion + feel pass (drift rewrite slice S4/4; umbrella task-042; SOLO in-session — never a background wave). Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md §S4. Spec: docs/superpowers/specs/2026-07-01-drift-physics-design.md §§3.2 (route-file gravity: drops), D7 (per-route driftScale authoring), D8, §6 build-time items 1–4. Size M.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Read spec §§3.2 (route drops), D7, D8, §6 items 1–4 before starting — no other context.
- [x] #2 All 8 route-file `gravity:` declarations (7 files) dropped — V4.6 src-grep evidence; route tests rewritten; zero `pageDef.gravity` assertions remain for drift routes. [spec §3.2, §3.8]
- [x] #3 Per-route `driftScale` authored route-side (never in `.layout.ts`): reading routes near-still, canvas routes livelier — evidenced in V4.2 smoke. [spec D7]
- [x] #4 `prefers-reduced-motion` ⇒ `driftScale = 0`; drag and peek still work; existing reduced-motion pin behavior unchanged. [spec D8]
- [x] #5 Box/BoxB converted and serving as the ladder + nested-cards demo with accurate walkthrough copy. [spec §6 item 4, D1]
- [x] #6 Chain routes' drift feel + `trail` scenography checked. [spec §6 item 2]
- [x] #7 Word-anchored/parked pose polish + wobble retuned for drift (`pinTuning.ts` wobble* values), feel-checked in the V4.5 session. [spec §3.3, §6 item 3]
- [x] #8 **Feel constants tuned solo in-session (visual/feel AC — never run as a background wave).** [spec §6 item 1]
- [x] #9 Full verify gate + V4.6 route-declaration sweep + final global grep sweep clean.
- [x] #10 D8 reduced-motion: driftScale=0 must ALSO still the prose repel (or spec accepts a one-time settle). driftScale scales only Brownian wander (spec §1), so driftScale=0 alone leaves repel pushing every non-dragged card to the repel/rope equilibrium on load — motion a reduced-motion user must not see. Source: task-042.01 Opus re-review L1 (spec §1 vs D8).
- [x] #11 Feel-tune driftTuning.damping below ~0.6: the drift tick clamps frictionAir at Math.min(damping,0.6) as a matter NaN-inversion backstop (frictionAir*(dt/16.667)>2 inverts drag to NaN, ~0.667 at the 50ms dt-clamp). Tuning damping above 0.6 silently hits the clamp (no viscosity gain), it does not NaN — do not tune into the clamp. Source: task-042.01 re-review L3 + reference_matter_js_frictionair_inversion.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md (§S4 — read its "Spec claims this slice load-bears on" list at execution). Spec (RATIFIED 2026-07-01, frozen): docs/superpowers/specs/2026-07-01-drift-physics-design.md. Blocked by: task-042.03 (S3). Branch: feat/task-042.04-drift-routes-feel off main after task-042.03 merges. SOLO in-session by AC — visual/feel work, never a background wave. Serial merges; no wave.

From task-042.02 (S2) adversarial review wf_5b9dc396 — 2 LOW findings deferred to S4 feel tuning:
(1) NaN-margin guard: the drift-tick frictionAir clamp `Math.min(driftTuning.damping, 0.6)` (PhysicsWorld.ts) runs AFTER `if (reg.body.isSensor) continue`, so a dismissed-preview sensor body carries UNCLAMPED registration-time frictionAir = driftTuning.damping for its ~fadeMs life. When tuning driftTuning.damping keep it within the NaN-inversion margin (~0.6 at 50ms dt) — the dismissed preview is not protected by the per-tick clamp that regular drift bodies get.
(2) Peek dismiss entrance-snap: dismissing within the 200ms peek-in entrance sets `animation:'none'` which snaps opacity/scale to full before the fade → a brief pop on sub-200ms dismiss (mobile double-tap). Cosmetic; polish alongside peekTuning fadeMs/dismissKick, or fold into the future 'melt' dismissal (spec §5).

SESSION HANDOFF 2026-07-03 (resume on EXISTING branch feat/task-042.04-drift-routes-feel, 2 commits 8f221ec+9ab2b0f — do NOT re-branch off main). DONE: AC#1,2,4,5,10 (route conversion, reduced-motion gate, repel binary-gate, copy, 3 test rewrites; gate was green). PIVOT: Chai ratified a spec §1 model change 2026-07-03 — Brownian (random kick every frame = ±7°/frame tremble, Chai dislikes) → RUN-AND-TUMBLE: card sits still; a per-card timer fires rarely → ONE impulse in a random direction → glides straight until a collision/wall/rope or damping redirects/stops it → still again. LEFT: (1) implement run-and-tumble TDD in PhysicsWorld tick drift pass + drift.ts + driftTuning.ts (knobs: impulseSpeed, impulseIntervalMs, damping<0.6; driftScale scales impulse speed so 0=reduced-motion still; velocity-add=mass-invariant; ms-interval=dt-invariant; injected rng=deterministic); (2) rework ~6-8 Brownian tests (repel-isolation gotcha: rng()=0.5 no longer zeroes wander — use huge impulseIntervalMs); (3) amend spec §1 + ADR-0010 + CONTEXT Drift term (DoD#3); (4) feel-tune SOLO w/ Chai (impulseSpeed/interval/damping + per-route driftScale + wobble + peek dismiss); (5) closeout: gate + modest adversarial-review + diff handoff + sign-off + squash-merge + umbrella-042 Done w/ gate-lift notes onto 038 & 041. Full detail: scratchpad/HANDOFF-task-042.04.md. Chai often AFK — wait, do not auto-proceed.

CLOSEOUT 2026-07-03 (Done): Run-and-tumble drift model shipped (replaced the Brownian per-frame kick that read as ±7°/frame tremble). Feel-tuned solo in-session w/ Chai: impulseSpeed 1.2, impulseIntervalMs 15000, damping 0.01; per-route driftScale left at placeholders (Chai deferred per-route tuning to later). All 11 ACs + 7 DoD met. Modest adversarial review (wf_f342380b, 3 Fable finders) found 4 issues — ALL fixed + verified: (1) HIGH reduced-motion spawn kick fired before usePageDef's driftScale-0 gate → gated on synchronous prefersReducedMotion(), in-browser confirmed cards one-time settle then fully still; (4) LOW usePageDef authored-driftScale window closed; (2) spec §1 repel-row binary-gate doc; (3) /test/box sensor-copy corrected. AC#7 wobble feel-checked (event-driven jiggle under drift, no retune needed). Branch feat/task-042.04-drift-routes-feel (8f221ec, 9ab2b0f, b8fe0bc, 24317db) → squash-merged to main; task↔commit via 'Refs task-042.04'.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
- [x] #7 Pre-merge review gate: run Workflow adversarial-review args={mode:"modest", task:"task-042.04", diffRange:"main...HEAD", specSections:"spec §§3.2 (route drops), D7, D8, §6 items 1–4"} after the verify gate; relay ALL confirmed/adjudication findings verbatim (never self-dismiss); fixes wait for user word
<!-- DOD:END -->
