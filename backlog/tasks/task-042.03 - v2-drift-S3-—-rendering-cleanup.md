---
id: TASK-042.03
title: v2 drift S3 — rendering + cleanup
status: Done
assignee: []
created_date: '2026-07-02 04:52'
updated_date: '2026-07-03 02:01'
labels:
  - claude-generated
  - v2
  - physics
milestone: v2
dependencies:
  - TASK-042.02
parent_task_id: TASK-042
priority: high
ordinal: 34010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rendering + cleanup (drift rewrite slice S3/4; umbrella task-042). Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md §S3. Spec: docs/superpowers/specs/2026-07-01-drift-physics-design.md §§3.6 (both entries), 3.7 (all, incl. the LayoutAxis gravity select via §3.2), 3.8 (sectionLayout deletion), D1 (demo deletions). Size M.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Read spec §§3.6, 3.7, 3.8 (deletions), D1 before starting — no other context.
- [x] #2 Drift routes render straight tether lines with slack/taut → stroke width + opacity; the sag branch is mode-gated, not deleted, and stays test-covered. [spec §3.6]
- [x] #3 `TetherView` exposes continuous `tension` with the exact formula pinned in `Tether.test.ts` case names + a code comment at `list()`, boundary behavior stated; the formula + per-call-allocation note appended onto **task-039's board entry** via `--append-notes` (naming this sub-task + spec §3.6) before Done — a note only in spec/code does not satisfy this. [spec §3.6, §3.8; backlog-core propagation rule]
- [x] #4 The 9 fossil constants are gone via the 4-file sweep; write-back round-trip test green. [spec §3.7]
- [x] #5 `sectionLayout.ts` + test deleted after verifying zero non-test importers at build time. [spec §3.8]
- [x] #6 `routes/sandbox/Strings.tsx` + its `App.tsx` registration deleted; client route table + lazy chunk removed; prerender set UNCHANGED (never prerendered — V3.1 note; spec D1's "prerender set shrinks" wording is escalated, see Escalations); `/sandbox/strings` 404s in smoke; `App.tsx:241` stale comment removed. [spec D1]
- [x] #7 Atelier world group demoted to dormant-mode presentation; "Re-drop" → "re-scatter"; `LayoutAxis.tsx` gravity select renders/writes only for gravity-carrying layouts (V3.4 UI-path check). [spec §3.7]
- [x] #8 Full verify gate + sweeps clean (V3.1, V3.5).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Plan: docs/superpowers/plans/2026-07-01-drift-physics-execution-plan.md (§S3 — read its "Spec claims this slice load-bears on" list at execution). Spec (RATIFIED 2026-07-01, frozen): docs/superpowers/specs/2026-07-01-drift-physics-design.md. Blocked by: task-042.02 (S2). Branch: feat/task-042.03-drift-rendering-cleanup off main after task-042.02 merges. AC3's --append-notes onto task-039 (tension formula + allocation note) happens at THIS task's execution time, before its Done. Serial merges; no wave.

DONE (S3, drift rendering + cleanup). StringLayer mode-gated straight(drift)/sag(dormant) + tension->stroke/opacity; TetherView continuous tension (task-039 contract, formula pinned in Tether.test.ts case name + list() comment + appended onto task-039). Deleted 9 fossils (4-file sweep, byte-identical regen green), sectionLayout module+test (zero non-test importers), sandbox/Strings gravity demo + App.tsx route. Atelier world group -> dormant-mode label + Re-drop->re-scatter; LayoutAxis gravity-select gating was S1 (verify-only). Modest pre-merge adversarial-review (wf_e0726827): 0 confirmed, 4 LOWs, ALL fixed on sign-off (header prose, mode-gate tension styling, formula-in-test-name, base stroke-width cap under --hot). Full gate green incl. in-browser smoke. Flags relayed to Chai: spec D1 prerender wording error; PRD:373 TransitionDirector roster staleness (pre-existing task-025).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
- [x] #7 Pre-merge review gate: run Workflow adversarial-review args={mode:"modest", task:"task-042.03", diffRange:"main...HEAD", specSections:"spec §§3.6, 3.7, 3.8 (deletions), D1"} after the verify gate; relay ALL confirmed/adjudication findings verbatim (never self-dismiss); fixes wait for user word
<!-- DOD:END -->
