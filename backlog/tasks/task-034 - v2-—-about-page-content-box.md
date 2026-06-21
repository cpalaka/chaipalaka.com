---
id: TASK-034
title: v2 — about page (content-box)
status: To Do
assignee: []
created_date: '2026-06-21 00:02'
labels:
  - claude-generated
  - v2
  - content
milestone: v2
dependencies:
  - TASK-026
priority: low
ordinal: 24010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the greenfield /about route as a quiet content-box (spec §8). No route, component, or copy exists today — fully net-new (route entry + component + authored bio prose with Portal links). Deferred from task-026 (Heartland-first scope, 2026-06-20). Needs an authoring decision on the bio copy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /about route exists under ContentBoxLayout as a quiet content-box (resting: 'quiet'), prerendered
- [ ] #2 Bio prose authored with Portal links; peek/keep fires on them inside the box
- [ ] #3 web/: typecheck + test + build green; prerendered no-JS floor present (data-server-rendered)
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
