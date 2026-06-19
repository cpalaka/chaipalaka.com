# ADR 0006: Word-anchored tethers, runtime tether creation, and scroll regimes

**Date:** 2026-06-19
**Status:** Accepted — **stability spike GREEN (task-018), priority of defenses
revised** (see decision #3 and `docs/spikes/2026-06-19-word-anchor-scroll-stability.md`)
**Task:** task-017 (design); task-018 (spike)
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
3. **Scroll stability — spike GREEN (task-018); the defense priority is
   REVISED from this ADR's original draft.** The full result + numbers live in
   `docs/spikes/2026-06-19-word-anchor-scroll-stability.md`; the load-bearing
   reversals:
   - **`translate-pair` is the primary (and sufficient) mechanism** — anchor
     tracks the real word exactly and the card body is translated by the same
     per-frame scroll delta, so the rope vector is scroll-invariant (overshoot
     stays at rest values at any scroll speed). This replaces the
     "per-frame anchor-delta clamp = primary" claim originally drafted here.
   - **The anchor-delta clamp is DROPPED from the word-anchored regime** — it
     does not help and it makes the rope-top visibly lag its own word. It keeps
     one role only: clamping floor/ceiling moves on **resize** (the i111 case).
   - **Velocity-coupled damping is optional feel polish and MUST be clamped**
     (`frictionAir ≤ ~0.2`); unclamped, it inverts into a velocity amplifier
     past ~827 px/frame at the dt=50ms clamp → NaN. This was the spike's most
     important catch.
   - The one-sided force-spring **never numerically explodes on its own** (NaN-
     free even undefended); the i111 "explosion" is a visual yank + boundary
     jam, handled by auto-park. The rAF `dt ≤ 50ms` clamp is a feel guard, not a
     stability guard.
   - Carries forward into the build (spec slices 4/5/8): one-way **hysteresis**
     auto-park with the parked length eased to taut; **finite-check** the
     `getBoundingClientRect` read; recursion translates the **whole subtree**.
   The original fallback (lock vertical during scroll, sway at rest) is **not
   needed** and is retired.

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

- The stability spike (first slice, spec §18.0) is **done and GREEN** — the
  design ships, with the revised defense priority in decision #3. Six guardrails
  (G1–G6) for slices 1/4/5/8 are enumerated in the spike doc.
- New: the runtime-tether lifecycle, the DOM-rect word anchor (viewport-space),
  the scroll-regime transitions, recall, and per-word wobble.
- Reduced-motion must newly gate the physics sim (nothing does today) — ADR-0008,
  spec §11.
