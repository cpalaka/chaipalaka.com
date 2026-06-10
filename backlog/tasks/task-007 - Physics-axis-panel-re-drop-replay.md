---
id: TASK-007
title: Physics axis panel + re-drop replay
status: Done
assignee: []
created_date: '2026-06-05 07:02'
updated_date: '2026-06-10 00:55'
labels:
  - claude-generated
  - atelier
  - ui
  - physics
milestone: Atelier v1
dependencies:
  - TASK-002
  - TASK-005
  - TASK-006
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 7
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Physics tab over physicsTuning via TuningSchema. Slider curation: matter.js response is nonlinear — tetherStiffness gets a log-scale slider (near-zero is 1e-9, not 1e-4); all ranges curated to the regime that works, not mathematically pretty bounds. Live changes act on the running world via the read-at-use rule (task-002). Replay: one re-drop button key-bumps the card layer so spawn → fall → pendulum-settle replays under current values; transition timings need no replay button — navigating is the replay. Write-back via the physics target of task-006 (whole-file regen). Gravity direction is per-route and lives in the arrangement axis, not here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mid-simulation slider changes visibly alter the running world (gravity, stiffness)
- [x] #2 tetherStiffness slider is log-scale and reaches true near-zero (1e-9) behavior
- [x] #3 Re-drop replays spawn → fall → pendulum-settle under current values
- [x] #4 Write-back regenerates physicsTuning.ts; after HMR reload, baselines refresh and dirty flags clear
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Merged to main as c6fdf03 (squash of feat/task-007-physics-axis-redrop). Grouped physics schema with log-scale tetherStiffness (true 1e-9 floor), physicsBinding live binder, re-drop via CardLayer key-bump (Outlet keying was a no-op — CardImpl keyed by entry id owns the body), per-target write-back. All ACs verified in dev browser; diff approved by Chai 2026-06-09. NB: amended pre-push to strip a stray spawnOffsetPx=200 write-back that automation had committed.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
