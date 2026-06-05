---
id: TASK-010
title: Prod-bundle guard test for Atelier code
status: To Do
assignee: []
created_date: '2026-06-05 07:02'
labels:
  - claude-generated
  - atelier
  - test
milestone: Atelier v1
dependencies:
  - TASK-005
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A marker string + bundle-splitting test proving no Atelier code ships in production chunks. Existing pattern: web/src/lib/canvas-only-marker.ts + web/src/__tests__/bundle-splitting.test.ts — add a second Atelier marker and assert it never lands in prod output. This automates AC #4 of task-005.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Test fails if any Atelier module lands in a production chunk; passes on the current build
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
