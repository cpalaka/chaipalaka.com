---
id: TASK-030
title: v2 — full design pass (impeccable + Claude design)
status: To Do
assignee: []
created_date: '2026-06-19 07:54'
labels:
  - claude-generated
  - v2
  - design
dependencies:
  - TASK-020
  - TASK-021
  - TASK-022
  - TASK-023
  - TASK-024
  - TASK-025
  - TASK-026
  - TASK-027
  - TASK-028
  - TASK-029
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: low
ordinal: 20010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The capstone visual design pass over the working v2 spine (spec sections 15/16), decided after the mechanics work so the aesthetic is chosen with full context. One coherent impeccable + Claude-design run. Owns: card chrome (title bar, body, outline, highlight states), preview / Portal / Pocket styling, content-box type/color/spacing, and the motion vocabulary (the section 15 easing/duration bands). Plus the deferred section 16 art-direction: card fragment-shader effects (foreground R3F layer tracking card rects; SVG/Houdini fallback; no backdrop-blur) and the background-shader overhaul. Restyles the token-separable spine without touching behavior. Owner-driven.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A coherent visual design system applied across the v2 spine (card chrome, preview, box, motion), replacing the v1 placeholder styling
- [ ] #2 Card fragment-shader effects + background-shader overhaul landed (or explicitly re-deferred)
- [ ] #3 Restyle touches styling/tokens only, no behavior regressions (spine tests green)
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
