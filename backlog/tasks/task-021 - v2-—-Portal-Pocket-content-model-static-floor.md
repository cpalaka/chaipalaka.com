---
id: TASK-021
title: v2 — Portal/Pocket content model + static floor
status: To Do
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-19 08:14'
labels:
  - claude-generated
  - v2
  - content
  - a11y
milestone: v2
dependencies:
  - TASK-020
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: high
ordinal: 11010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The authored content model + accessible static floor (spec sections 3/11/13, ADR-0008). Add a footnotes remark plugin to the MDX pipeline (none today). Define the single authored source node so one MDX footnote/aside renders BOTH the in-flow static inline disclosure AND the data hook the ladder lifts into a Pocket card. Portal links = real anchors with link-type + link-icon styling; Pocket = a disclosure (button aria-expanded aria-controls, or details/summary), NOT a styled anchor, so SR users hear 'expand' not 'link'. Render MDX to HTML in the RSS feed generator (today it ships raw MDX body). Responsive sidenote/footnote split. No physics in this slice.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An MDX post with Portal links + Pocket footnotes renders correct accessible static HTML (real anchors; disclosure with aria-expanded)
- [ ] #2 Pocket footnote content appears as rendered HTML in RSS (not raw MDX)
- [ ] #3 Each Pocket exposes the card-lift data hook for the ladder
- [ ] #4 Keyboard + SR: Portal navigates, Pocket toggles inline (verified)
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
