---
id: TASK-003
title: Layout-as-data refactor for scatter routes
status: To Do
assignee: []
created_date: '2026-06-05 07:01'
labels:
  - claude-generated
  - atelier
  - refactor
  - layout
milestone: Atelier v1
dependencies: []
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 3
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move each scatter route's layout to a sibling data file web/src/routes/<route>.layout.ts — { gravity, cards: [{ id, kind, parent, anchor }] } satisfies RouteLayout. anchor becomes { fx, fy } | (viewport) => Vec2: fractions resolved by a helper, closures stay legal for computed layouts. Route components zip layout with their cardContent exactly as today. Write-back story is whole-file regeneration — no AST surgery anywhere. Scope fences: add/remove cards stays in code; the current / placeholder keeps its computed letter anchors (not drag-editable). Independently valuable; prerequisite for Arrange mode (task-008).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each scatter route renders identically from its .layout.ts data file (dev smoke per route)
- [ ] #2 Fraction anchors resolve via the helper; closure anchors still work
- [ ] #3 Layout files are pure data literals suitable for whole-file regeneration
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
