---
id: TASK-021
title: v2 — Portal/Pocket content model + static floor
status: Done
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-20 12:42'
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
- [x] #1 An MDX post with Portal links + Pocket footnotes renders correct accessible static HTML (real anchors; disclosure with aria-expanded)
- [x] #2 Pocket footnote content appears as rendered HTML in RSS (not raw MDX)
- [x] #3 Each Pocket exposes the card-lift data hook for the ladder
- [x] #4 Keyboard + SR: Portal navigates, Pocket toggles inline (verified)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Portal/Pocket static-floor pipeline shipped. remark-gfm + rehype-pocket-footnotes (<details data-pocket-id> disclosure, card-lift hook) + rehype-link-types (portal/external), shared by the page MDX pipeline and the RSS generator (compileBodyToHtml). <details> over button (zero-JS floor). RSS renders footnotes, omits MDX JSX components (known limitation). All 4 ACs verified incl. agent-browser keyboard/disclosure pass. Card-lift hook pinned to task-022.
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
