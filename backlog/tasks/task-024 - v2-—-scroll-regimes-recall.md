---
id: TASK-024
title: v2 — scroll regimes + recall
status: To Do
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-19 09:17'
labels:
  - claude-generated
  - v2
  - physics
  - a11y
milestone: v2
dependencies:
  - TASK-023
  - TASK-018
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: medium
ordinal: 14010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pinned-card scroll behavior (spec section 5). Two regimes: word-anchored (tracks scroll with the spike's delta-clamp + velocity-damping) and edge-anchored (parked at top/bottom). Transitions: drag-to-edge re-anchors; auto-park when the source word scrolls past the fold (parks at the edge it exited through); recall = scroll the word back (it keeps a distinct, click-suggesting persistent highlight), click it, the card eases home with hysteresis (never automatic, no yo-yo). Snap-to-edge motion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A pinned card tracks scroll while its word is visible, then auto-parks at the edge the word exited through
- [ ] #2 Recall: scrolling the word back shows a discoverable highlight; clicking brings the card home with no yo-yo
- [ ] #3 A first-time user can recall a parked card without instruction
- [ ] #4 Reduced-motion path verified (instant park/recall)
- [ ] #5 Honors task-018 spike guardrails for scroll stability: G1 translate-pair (anchor tracks word, no anchor-delta clamp); G2 if velocity-coupled damping is used, clamp frictionAir <= ~0.2 (unclamped it inverts into a velocity amplifier -> NaN past ~827px/frame at dt=50ms); G3 auto-park is one-way (hysteresis) and the parked re-tether length eases to taut, never left slack; G4 finite-check getBoundingClientRect. See docs/spikes/2026-06-19-word-anchor-scroll-stability.md
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
