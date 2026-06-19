---
id: DRAFT-002
title: v2 art-direction — fragment-shader effects on cards
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
Post-v2-spine art-direction (spec section 16): give cards true fragment-shader effects (dissolve/displacement/glow, the fall-away) via a foreground R3F layer rendering shader quads that track the DOM card rects (the same rect-tracking trick as the word-anchor). SVG feTurbulence/feDisplacementMap or CSS Houdini as a no-WebGL fallback. No backdrop-blur (avoid glassmorphism). Split out of the capstone design pass (TASK-030); promote to a task once grilled.
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
