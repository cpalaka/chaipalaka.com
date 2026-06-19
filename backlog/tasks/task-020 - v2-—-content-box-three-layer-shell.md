---
id: TASK-020
title: v2 — content box + three-layer shell
status: To Do
assignee: []
created_date: '2026-06-19 07:53'
updated_date: '2026-06-19 09:17'
labels:
  - claude-generated
  - v2
  - content
milestone: v2
dependencies: []
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: high
ordinal: 10010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the v2 content box (spec sections 6/8/11/14): one fixed, solid, scrollable prose surface per route, floating over the generative shader, with cards in a foreground plane above it (three-layer depth: shader / box / cards). The box is fixed DOM (not a physics body) but its edges are physics-aware (cards collide with the box rect and can tether to its top/bottom edges). Generalize the existing blog plain reader (BlogPostReader/BlogPost + MDX render) into the static reading substrate (PlainLayout is only a thin Outlet wrapper). Build on the existing v1 card styling; keep styling token-separable (CSS custom properties) since visual design is the capstone (last task), not this slice. Assumes content stays within the box (no wide-media rule in v2.0).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A route renders gwern-style prose in a fixed solid scrollable box over the shader, with three planes of depth
- [ ] #2 The box rect acts as physics walls (a test card collides with / can tether to its edges)
- [ ] #3 No-JS/prerender renders the box prose statically (ADR-0004 floor preserved)
- [ ] #4 Styling is token-separable (no hardcoded colors/spacing in components)
- [ ] #5 Honors task-018 spike guardrail G6 (static-edge/i111): when setViewport moves the box floor/ceiling edge bodies on RESIZE, clamp the per-frame move or translate-pair edge-anchored cards so anchorA-relative tethers don't yank them. Box edges are viewport-fixed so this is resize-only, not scroll. See docs/spikes/2026-06-19-word-anchor-scroll-stability.md
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
