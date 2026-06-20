---
id: TASK-030
title: v2 — full design pass (impeccable + Claude design)
status: To Do
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-20 11:46'
labels:
  - claude-generated
  - v2
  - design
milestone: v2
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
The capstone visual design pass over the working v2 spine (spec section 15), decided after the mechanics work so the aesthetic is chosen with full context. One coherent impeccable + Claude-design run. Owns: card chrome (title bar, body, outline, highlight states), preview / Portal / Pocket styling, content-box type/color/spacing, and the motion vocabulary (the section 15 easing/duration bands). Restyles the token-separable spine without touching behavior. Owner-driven. NOTE: the section 16 art-direction follow-ups are split into separate drafts (out of this task's scope): DRAFT-002 (card fragment shaders), DRAFT-003 (background-shader overhaul), DRAFT-004 (asymmetric wide media).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A coherent visual design system applied across the v2 spine (card chrome, preview, box, motion), replacing the v1 placeholder styling
- [ ] #2 Restyle touches styling/tokens only, no behavior regressions (spine tests green)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Token-name bug to fix during the reskin (found in task-020): ReadingSubstrate.css (and BlogPost.css) reference --text-sm/--text-xs/--text-2xl/--text-3xl, which do not exist in tokens.css (real names are --font-size-*). They resolve to nothing → those font-sizes inherit. Carried verbatim during the task-020 reader extraction to keep /blog/:slug/read byte-identical; correct to --font-size-* here.
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
