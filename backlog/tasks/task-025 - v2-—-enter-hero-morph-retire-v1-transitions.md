---
id: TASK-025
title: v2 — enter / hero morph + retire v1 transitions
status: Done
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-20 23:13'
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
- [x] #1 Clicking a Portal card morphs it into the destination page; chrome nav uses the physical default
- [x] #2 The v1 Director/primitive transition system is removed (barrel gone; build green)
- [x] #3 Focus lands on the destination heading and the route change is announced to SR
- [x] #4 Reduced-motion path (crossfade) verified
- [x] #5 Honors task-019 spike decision (see ADR-0007 § Spike result): hero morph uses the browser-native View Transitions API via react-router 6.30 <Link viewTransition> + useViewTransitionState (shared view-transition-name on the clicked card and dest box). Do NOT adopt react@experimental <ViewTransition> (requires react@canary, breaks the vite-react-ssg pins); canvas/flip.ts FLIP is a fallback option only. Unsupported browsers (no document.startViewTransition) fall back to plain client nav. The data router does NOT auto-announce route changes (no announcer exists today) — ship a real SR route announcer; reduced-motion disables ::view-transition-* in CSS (no central Director, ADR-0008).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shipped: retired the v1 transitions/ subsystem (Director/dispatch/primitives/PageDefRegistry/TransitionSpec) + orphaned pageDefs.ts + the task-019 spike; PageDef=PageSpec; useHashSection relocated to routes/blog/. Hero morph = nav/morph.ts (navigate viewTransition + a morph-target signal naming source card vs dest box — useViewTransitionState matches from+to and aborted on the duplicate; honors the spike (a) browser-native VT choice). Physical default = root crossfade on FrameBar chrome links + a Portal word-click (PortalNav). Card title-bar OR body both morph. RouteAnnouncer (SR) + ContentBox focus-follow in both layouts; reduced-motion CSS gate in base.css; unsupported browsers fall back to plain nav. Demo dest /test/box-b (/blog rollout=026). All 5 AC verified in Chromium (morph animates, focus, SR announce, reduced-motion, no-VT fallback, both directions, no ghost cards). DRAFT-007 parks transition-feel customizations.
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
