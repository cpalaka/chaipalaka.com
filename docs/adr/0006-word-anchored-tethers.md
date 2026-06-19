# ADR 0006: Word-anchored tethers, runtime tether creation, and scroll regimes

**Date:** 2026-06-19
**Status:** Accepted (design — gated by a stability spike before build)
**Task:** task-017
**Spec:** `docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md` §5

---

## Context

In the v2 **Ladder** (ADR-0005), pinning a link creates a **Card** strung to the
exact **source word** — the rope literally connects the link to its content. Two
codebase facts make this load-bearing *and* risky:

1. **ADR-0001 §3 forbids runtime tether creation** — "string topology is declared
   in the route's `PageDef`; no UI for creating or destroying strings at runtime."
   Pinning *is* a user-created tether, so v2 reverses that contract for the
   **Card**s a user pins.
2. **The Tether is a hand-rolled one-sided force-spring**, not a `Matter.Constraint`
   (`Tether.ts`: force ∝ overshoot only when distance > length; `anchorA`
   body-relative, resolved each frame). A word anchor that moves with scroll feeds
   a fast-moving position into that force — the exact structure behind the prior
   i111 "moving a parent yanks every child tether" regression.

---

## Decision

1. **Pinning creates a Tether at runtime** from a user gesture, with a new
   lifecycle (create on pin; destroy on dismiss/recall). The card-parent **Tether**
   topology (`parent: <cardId>`/`ceiling`/`floor`, ADR-0001 §4) is reused; the
   runtime-creation path is new.
2. **Two anchor regimes** — **word-anchored** (tethered to the source word, tracks
   scroll, the word wobbles) ↔ **edge-anchored** (top/bottom viewport edge, the
   parked state, reusing the ceiling/floor tether) — with **auto-park** on
   scroll-off and manual **recall**.
3. **Scroll stability is gated by a throwaway spike before any production
   word-anchor code.** Approach to validate: a **per-frame anchor-delta clamp**
   (primary defense), translate the anchor+body pair together (keep overshoot
   ~constant), and scroll-velocity-coupled damping (feel + cushion). Fallback if
   the spike fails: lock vertical position during active scroll, sway only at rest.

---

## Why

Word-anchoring is the one idea that justifies *merging* gwern with physics rather
than bolting them together — the rope carries meaning. But force-spring +
moving-anchor is exactly where this codebase has exploded before, so the
commitment is gated on proof, not faith.

## Trade-offs

- **Reverses ADR-0001 §3** for user-pinned cards: authored topology stays
  design-time; pinned topology is runtime. Accepted — pinning is the whole toy.
- The per-word **wobble is built from scratch** (a single-span, transform-only
  spring). It is **not** a `@chenglou/pretext` capability — pretext is
  measurement-only and supplies word *geometry*, not animation (spec §5
  correction; PRD:381 keeps real DOM text untouched).

## Consequences

- A stability spike is the first slice (spec §18.0); the design does not ship if
  the spike fails without the documented fallback.
- New: the runtime-tether lifecycle, the DOM-rect word anchor (viewport-space),
  the scroll-regime transitions, recall, and per-word wobble.
- Reduced-motion must newly gate the physics sim (nothing does today) — ADR-0008,
  spec §11.
