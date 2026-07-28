---
id: TASK-045
title: 'prod-v1 — per-route composed layout design (/stuff, /stuff/flash, 404)'
status: To Do
assignee: []
created_date: '2026-07-27 01:37'
updated_date: '2026-07-28 21:20'
labels:
  - claude-generated
  - prod-v1
  - design
milestone: prod-v1
dependencies:
  - TASK-033
  - TASK-034
priority: medium
ordinal: 38010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1 (exit 2026-08-16), about 8 h. Brief A6/A9: each route gets its own custom composed layout. THIS IS LAYOUT COMPOSITION, NOT THE VISUAL SYSTEM — the visual system is TASK-030 capstone and must not be pre-empted here. Build on placeholder, token-separable styling (the ratified spine-first sequencing rule).

ALREADY DONE, NO WORK: /blog and /blog/:slug shipped the vertical reading-oriented composition A6 describes, and / shipped its bespoke populated landing — both in task-026.

OUT OF SCOPE BY DECISION: /lifelog composition is authored inside TASK-033 (inseparable from the STRUNG anchor topology). / is NOT reopened — reopening a route deliberately designed ten weeks ago is a redesign, not a rollout (open-questions T13); the default is that / and /stuff do NOT follow lifelog into composed-canvas, and converting either adds unbudgeted hours that force a C-list cut.

IN SCOPE: /stuff, /stuff/flash, 404.

Plan: docs/plan/workstream-design.md WP-05.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /stuff, /stuff/flash and the 404 each have a deliberate composed layout rather than the default shared shape, at desktop width. Placeholder styling only — no design-system decisions, no token invention.
- [ ] #2 The 404 layout is designed against the STATIC page TASK-044 makes SSG emit, not only against the client route. If TASK-044 has not landed the 404 prerender yet, design it anyway and note the dependency — the two must agree.
- [ ] #3 Layouts survive the responsive pass by construction where cheap: do not author anything that can only work at one width. The responsive foundation is a separate M2 piece and the capstone runs over the mobile-complete whole, so a layout that inverts at 390 px is rework.
- [ ] #4 CUT-5 SCOPE MARKER: /stuff is the cuttable half of this task and M1 is budgeted to fire it (M1 loads 35 h against 30). If CUT-5 fires, /stuff wears the shared content-box shape and still reads deliberate once the capstone has run; only /stuff/flash and 404 keep bespoke layouts. Firing it is a checkpoint decision, recorded, not a silent trim.
- [ ] #5 Verify gate green; agent-browser pass in the MAIN session (never a subagent — its screenshots never reach the orchestrator) with an explicit viewport, one screenshot per route.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
POINTER from task-043 sweep 2026-07-28: OPEN GitHub issue #78 'Add remaining Flash pieces (SWFs, thumbnails, MDX)' duplicates this task's /stuff/flash scope and predates the board — read it before designing the flash route treatment. It is gated by open decision O4 (are the ~40 items .swf or video), due 2026-09-06, already pinned on this task. Separately, task-043 did NOT re-verify the assets/ payload finding; the plan's README finding 2 (33MB of assets/ with 4 .swf plus the Ruffle nightly-2026-05-12 runtime present on this machine) stands as the planning session's observation, and whether assets-sync has ever run against the box remains answerable only by a live curl in task-044.
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
