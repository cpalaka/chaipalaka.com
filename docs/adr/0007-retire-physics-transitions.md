# ADR 0007: Retire the v1 physics route-transition system

**Date:** 2026-06-19
**Status:** Accepted (design — implementation not started)
**Task:** task-017
**Spec:** `docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md` §10
**Supersedes:** the route-transition designs from issues #21 / #81 / #22

---

## Context

v1's route-transition system — `TransitionDirector`, `TransitionSpec` (the
`TransitionId` union), `dispatch()`, and the `transitions/primitives/`
(anchor-slide, cross-fade, pour-in-drop, string-cut-drop) — animates a *foreground
swarm of cards* drifting offscreen toward gravity on navigation, with forward/back
directionality. It has been redesigned three times (#21/#81/#22).

v2 (ADR-0005) makes a route a **content box** + sparse pinned **Card**s, not a
swarm. "Cards drift offscreen on nav" no longer describes the page — there is
nothing to drift but the reading box, which is incoherent.

---

## Decision

Retire the v1 transition subsystem. Replace it with **one rule at navigation
time:**

> **Is there a source element to morph from?**
> → **Yes** (a clicked **Card**) → **hero morph** — the card expands/reflows into
>   the destination **content box**.
> → **No** (chrome-originated nav: frame bar, back/forward, direct URL) →
>   **physical default** — a lightweight directional box slide/crossfade.

---

## Why

The morph makes the **Ladder** continuous (the thing you previewed *becomes* the
page); the physical default preserves v1's directional, physical *spirit* for navs
with no source card, without the card-swarm machinery.

## Trade-offs / honesty

- **The hero morph is greenfield, not reuse.** There is **no** `<ViewTransition>`
  in the installed React (19.2.6 stable — it ships only on React's experimental
  channel), and the PRD only *specced* a morph (slice 22, never built; the one
  morph ever built was the slice-28 FLIP, deleted by ADR-0002). A spike must pick
  the mechanism — browser-native `document.startViewTransition`, `react@experimental`
  `<ViewTransition>` (a toolchain-pin change against the `vite-react-ssg` peer-dep
  discipline), or the existing `canvas/flip.ts` FLIP — and verify it under
  `vite-react-ssg` prerender + `react-router-dom` v6, with focus/SR route-change
  announcement preserved.

## Consequences

- Retirement blast radius = the `transitions/index.ts` barrel (`TransitionDirector`,
  `TransitionSpec`/`TransitionId`, `dispatch`, the four primitives, `PageDefRegistry`,
  `useHashSection`, edges). Enumerate exactly when the retirement slice lands.
- `reducedMotion` handling currently lives in `TransitionDirector`; the morph and
  physical default must each carry their own reduced-motion paths (ADR-0008).
- Replaces, in CONTEXT.md, the transition-primitive vocabulary with **hero morph**
  / **physical default**.
