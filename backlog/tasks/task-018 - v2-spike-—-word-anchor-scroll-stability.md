---
id: TASK-018
title: v2 spike — word-anchor scroll stability
status: Done
assignee: []
created_date: '2026-06-19 07:53'
updated_date: '2026-06-19 09:13'
labels:
  - claude-generated
  - v2
  - spike
  - physics
milestone: v2
dependencies: []
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: high
ordinal: 8010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Throwaway spike gating the v2 word-anchored-card design (spec section 5). Prove a pinned full-physics card tethered to a source word survives fast scroll (trackpad fling, mobile momentum) and the auto-park hand-off without the tether exploding (the i111 'moving anchor yanks every child tether' failure). The Tether is a hand-rolled one-sided force-spring (Tether.ts), not a Matter.Constraint. Validate: per-frame anchor-delta clamp (primary defense), translate anchor+body together, scroll-velocity-coupled damping. Output: go/no-go + chosen approach, or the documented fallback (lock vertical position during active scroll, sway at rest). No production code ships from this.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A pinned word-anchored card tracks a fast fling + momentum scroll with no tether blow-up or NaN
- [x] #2 The word-to-edge auto-park hand-off is visually smooth
- [x] #3 A written go/no-go recommendation + chosen approach (or fallback) is recorded
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GO. Spike GREEN, merged to main b873559. translate-pair is primary+sufficient; anchor-delta clamp dropped; velocity-damping must be clamped (frictionAir<=~0.2, else inverts->NaN past ~827px/frame@dt50). Force-spring never NaNs alone. Doc: docs/spikes/2026-06-19-word-anchor-scroll-stability.md (G1-G6); ADR-0006 decision #3 rewritten.
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
