---
id: TASK-029
title: v2 — external-link annotation cards
status: To Do
assignee: []
created_date: '2026-06-19 07:54'
labels:
  - claude-generated
  - v2
  - content
dependencies:
  - TASK-022
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: low
ordinal: 19010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Authored previews for external (cross-origin) links, which cannot be live-transcluded (spec section 9). An external link is Portal-shaped but its preview is an authored annotation card (title + source + note); enter opens the URL in a new tab; marked visually distinct from internal links. Built after internal transclusion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An external link peeks an authored annotation card (title/source/note) and can be pinned
- [ ] #2 Enter opens the external URL in a new tab
- [ ] #3 External links are visually distinct from internal Portal/Pocket links
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
