---
id: TASK-042.04
title: 'v2 drift S4 — route conversion + feel pass (SOLO, in-session)'
status: To Do
assignee: []
created_date: '2026-07-02 04:53'
updated_date: '2026-07-02 05:29'
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
- [ ] #1 Read spec §§3.2 (route drops), D7, D8, §6 items 1–4 before starting — no other context.
- [ ] #2 All 8 route-file `gravity:` declarations (7 files) dropped — V4.6 src-grep evidence; route tests rewritten; zero `pageDef.gravity` assertions remain for drift routes. [spec §3.2, §3.8]
- [ ] #3 Per-route `driftScale` authored route-side (never in `.layout.ts`): reading routes near-still, canvas routes livelier — evidenced in V4.2 smoke. [spec D7]
- [ ] #4 `prefers-reduced-motion` ⇒ `driftScale = 0`; drag and peek still work; existing reduced-motion pin behavior unchanged. [spec D8]
- [ ] #5 Box/BoxB converted and serving as the ladder + nested-cards demo with accurate walkthrough copy. [spec §6 item 4, D1]
- [ ] #6 Chain routes' drift feel + `trail` scenography checked. [spec §6 item 2]
- [ ] #7 Word-anchored/parked pose polish + wobble retuned for drift (`pinTuning.ts` wobble* values), feel-checked in the V4.5 session. [spec §3.3, §6 item 3]
- [ ] #8 **Feel constants tuned solo in-session (visual/feel AC — never run as a background wave).** [spec §6 item 1]
- [ ] #9 Full verify gate + V4.6 route-declaration sweep + final global grep sweep clean.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md (§S4 — read its "Spec claims this slice load-bears on" list at execution). Spec (RATIFIED 2026-07-01, frozen): docs/superpowers/specs/2026-07-01-drift-physics-design.md. Blocked by: task-042.03 (S3). Branch: feat/task-042.04-drift-routes-feel off main after task-042.03 merges. SOLO in-session by AC — visual/feel work, never a background wave. Serial merges; no wave.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
- [ ] #7 Pre-merge review gate: run Workflow adversarial-review args={mode:"modest", task:"task-042.04", diffRange:"main...HEAD", specSections:"spec §§3.2 (route drops), D7, D8, §6 items 1–4"} after the verify gate; relay ALL confirmed/adjudication findings verbatim (never self-dismiss); fixes wait for user word
<!-- DOD:END -->
