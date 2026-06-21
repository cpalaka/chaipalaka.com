---
id: TASK-033
title: v2 — lifelog content-box rollout
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
ordinal: 23010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Convert /lifelog from the v1 scatter card-chain to a quiet content-box route (spec §8). The live /api/{books,now-playing,films,github} widgets move from physics cards into the content-box body, keeping the fetches. Deferred from task-026 (Heartland-first scope, 2026-06-20).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /lifelog renders under ContentBoxLayout as a quiet content-box (resting: 'quiet')
- [ ] #2 The four live widgets (books, now-playing, films, github) fetch and render inside the box
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
