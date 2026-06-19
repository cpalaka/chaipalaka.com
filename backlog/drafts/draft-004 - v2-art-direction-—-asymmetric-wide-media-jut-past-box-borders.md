---
id: DRAFT-004
title: v2 art-direction — asymmetric wide media (jut past box borders)
status: Draft
assignee: []
created_date: '2026-06-19 08:18'
labels:
  - claude-generated
  - v2
  - art-direction
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-v2-spine art-direction (spec section 16): let wide images / visual content jut out past the content-box borders for an off-the-grid, asymmetric look (vs everything inside a clean rectangle). Reconcile with the card foreground plane that shares the edge space (section 6) and the v2.0 'content stays within the box' assumption (section 13). Split out of the capstone design pass (TASK-030); promote to a task once grilled.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
