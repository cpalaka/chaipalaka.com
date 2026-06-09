---
id: TASK-004
title: AtelierStore + working sets
status: Done
assignee: []
created_date: '2026-06-05 07:02'
updated_date: '2026-06-09 21:47'
labels:
  - claude-generated
  - atelier
  - state
milestone: Atelier v1
dependencies:
  - TASK-001
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 4
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A subscribable (web/src/state/subscribable.ts) holding working state: current values per axis, per-field dirty flags vs. source baselines. Persisted via persistentMap under key chaipalaka.atelier. A working set is a named snapshot of everything tunable: { tokens: {dark, light}, physics, chain, layout: {<route>} }. Switching sets re-applies every live binder instantly — this is the A/B/N comparison story. Baseline = current source values (tokens via getComputedStyle, read per theme when that theme becomes active in the panel; physics/chain/layout imported from their data modules). Per-field dirty = diff vs. baseline; per-field and per-axis reset. After write-back + HMR reload, the overlay reconciles: baselines refresh, dirty flags clear. Per-field model derives from TuningSchema fieldsOf/defaultsOf (task-001).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tests: set switching, dirty-diffing, baseline reconciliation (AtelierStore test suite)
- [x] #2 Working sets persist across reload under chaipalaka.atelier
- [x] #3 Per-field and per-axis reset restore baseline values
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AtelierStore + working sets merged to main as 9bf30b4 (squash of feat/task-004-atelier-store). 17 tests; baselines re-derived per load (not persisted); sanitize-on-hydrate; CONTEXT.md glossary entries AtelierStore/Working set/Baseline. Verified post-merge: typecheck 0, 674 tests green, build + prerender, secret grep clean. Chai sign-off 2026-06-09.
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
