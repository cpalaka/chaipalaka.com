---
id: TASK-025
title: v2 — enter / hero morph + retire v1 transitions
status: To Do
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-19 09:39'
labels:
  - claude-generated
  - v2
  - transitions
  - a11y
milestone: v2
dependencies:
  - TASK-022
  - TASK-019
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: medium
ordinal: 15010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Navigation (spec section 10, ADR-0007). Implement the hero morph via the spiked approach (TASK-019): a clicked Portal card expands/reflows into the destination content box. Retire the v1 physics route-transition system (TransitionDirector/TransitionSpec/dispatch/primitives, the transitions/index.ts barrel). Add the physical default (lightweight directional box slide/crossfade) for chrome-originated nav (frame bar, back/forward, direct URL) where there is no source card. Move focus to the destination content-box heading + preserve the SR route-change announcement.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Clicking a Portal card morphs it into the destination page; chrome nav uses the physical default
- [ ] #2 The v1 Director/primitive transition system is removed (barrel gone; build green)
- [ ] #3 Focus lands on the destination heading and the route change is announced to SR
- [ ] #4 Reduced-motion path (crossfade) verified
- [ ] #5 Honors task-019 spike decision (see ADR-0007 § Spike result): hero morph uses the browser-native View Transitions API via react-router 6.30 <Link viewTransition> + useViewTransitionState (shared view-transition-name on the clicked card and dest box). Do NOT adopt react@experimental <ViewTransition> (requires react@canary, breaks the vite-react-ssg pins); canvas/flip.ts FLIP is a fallback option only. Unsupported browsers (no document.startViewTransition) fall back to plain client nav. The data router does NOT auto-announce route changes (no announcer exists today) — ship a real SR route announcer; reduced-motion disables ::view-transition-* in CSS (no central Director, ADR-0008).
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
