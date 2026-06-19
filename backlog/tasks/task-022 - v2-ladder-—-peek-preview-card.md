---
id: TASK-022
title: v2 ladder — peek (preview card)
status: To Do
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-19 08:14'
labels:
  - claude-generated
  - v2
  - ladder
  - a11y
milestone: v2
dependencies:
  - TASK-020
  - TASK-021
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: high
ordinal: 12010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The first ladder rung end-to-end (spec section 4). Desktop: hover-dwell (~200-300ms + a movement-stillness threshold + dwell-progress) on a Portal/Pocket link spawns a side-positioned, stiff-anchored preview card with a safe-triangle hover-bridge; it transcludes the Portal lead or holds the Pocket note; the body is the click/read zone. Mobile: tap to a non-reflow overlay, previews collect at a bottom rail. Dismiss = hover-end / tap-outside cuts the tether and the card falls physically (bounded lifetime); scroll-dismiss suppressed while the pointer is over the card/bridge. Keyboard: focus-or-Enter trigger. Build on existing v1 card styling, token-separable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hovering/tapping a link shows a readable preview (Portal lead / Pocket note) without occluding the source line; dismiss falls physically
- [ ] #2 Dwell + safe-triangle bridge make the card reliably reachable; sweeping many links does not litter
- [ ] #3 Keyboard users can open + read a preview via focus/Enter
- [ ] #4 Reduced-motion path verified (instant placed preview, no fall)
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
