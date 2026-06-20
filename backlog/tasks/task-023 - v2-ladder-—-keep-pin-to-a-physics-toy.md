---
id: TASK-023
title: v2 ladder — keep (pin to a physics toy)
status: Done
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-20 14:37'
labels:
  - claude-generated
  - v2
  - ladder
  - physics
milestone: v2
dependencies:
  - TASK-022
  - TASK-018
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: high
ordinal: 13010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The pin rung (spec sections 4/5, ADR-0006). Rewrite the CardImpl pointer state machine: the title bar becomes the press-hold/arm/drag zone and the body a click-to-enter target (the INVERSE of today, where the body drags and the header is the no-drag zone). Thresholds: arm on press >=~200ms OR move >~6px; release before both = click; leave the bar before arm = abort. Pinning creates a tether at RUNTIME (new lifecycle; v1 tethers are PageDef-authored only, ADR-0001 section 3) anchoring the card to its source word. Per-word wobble on the tethered word (single-span, transform-only; NOT pretext, which is measurement-only). Transient + persistent highlight on the bonded trio. Uses the spike's word-anchor approach. Build on v1 card styling, token-separable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Press-hold the title bar + drag pins a preview into a persistent physics card strung to its source word
- [x] #2 Click vs press-hold disambiguation works on a small card (no accidental enter/drag)
- [x] #3 The tethered word wobbles (transform-only; SR/selection/copy unaffected); the bonded trio highlights on hover
- [x] #4 Reduced-motion path verified (instant pin, static highlight, no wobble)
- [x] #5 Honors task-018 spike guardrails: G1 word-anchor tracking uses translate-pair (anchor tracks the real word; card body translated by the same scroll delta; NO anchor-delta clamp) and G4 finite-check getBoundingClientRect before feeding scrollDelta. See docs/spikes/2026-06-19-word-anchor-scroll-stability.md
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Slice 4 (Keep). Built as a self-contained web/src/pin/ subsystem parallel to peek/ — NOT a CardImpl rewrite (Chai's call); CardImpl/CardRegistry untouched. Press-hold a preview's title bar -> arm -> drag -> drop pins a persistent full-physics PinnedCard strung to its source word via a runtime tether. Cores (TDD): pinGesture (arm/click/abort/drag, AC#2), wordAnchor (translate-pair G1 + finite-check G4, AC#5), wobble (transform-only velocity-driven oscillator). Runtime tether = 3 additive PhysicsWorld primitives: registerAnchor (static word-anchor proxy), translate (velocity-preserving), onBeforeTick (pre-tick ordering). Bonded-trio highlight; reduced-motion = placed pin, no wobble. Enter=plain nav (morph is slice 6); auto-park/recall is slice 5. Verified: typecheck+849 tests+build green; all 5 ACs via agent-browser on /test/box. Recorded in spec §4 resolved note, ADR-0006, CONTEXT.md.
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
