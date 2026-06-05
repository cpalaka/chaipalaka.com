---
id: TASK-007
title: Physics axis panel + re-drop replay
status: To Do
assignee: []
created_date: '2026-06-05 07:02'
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
- [ ] #1 Mid-simulation slider changes visibly alter the running world (gravity, stiffness)
- [ ] #2 tetherStiffness slider is log-scale and reaches true near-zero (1e-9) behavior
- [ ] #3 Re-drop replays spawn → fall → pendulum-settle under current values
- [ ] #4 Write-back regenerates physicsTuning.ts; after HMR reload, baselines refresh and dirty flags clear
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
