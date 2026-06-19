# ADR 0005: The v2 link ladder + content-box model

**Date:** 2026-06-19
**Status:** Accepted (design — implementation not started)
**Task:** task-017
**Spec:** `docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md`

---

## Context

v1's identity is "the page IS the toy": every route is a swarm of physics
**Card**s over a generative background (PRD Solution; ADR-0001). The v2
brainstorming + grilling session (2026-06-18) set a different north star — merge
gwern.net's reading-craft (dense typographic longform, link-popups, footnotes)
with the physics-toy — without the two fighting on the same surface.

The tension: gwern's popups exist to *kill* friction (peek, read, move on);
physics balloons *add* friction (grab, swing, settle). One surface cannot be both
a calm reading machine and a tactile swarm.

---

## Decision

Relocate the play from the *substrate* to the *interaction*.

1. **Each route is a fixed, solid, scrollable content box** — gwern-style prose —
   floating over the shader, with **Card**s in a foreground plane above it
   (three-layer depth: shader / box / cards). The box is fixed DOM, not a physics
   body, but its edges participate in physics.
2. **One unified mechanic — the link ladder:** any meaningful link is one object
   at three commitment levels — **peek** (hover/tap → an ephemeral preview
   **Card** beside its source word) → **keep** (pin → a persistent full-physics
   **Card** strung to that word) → **enter** (navigate to the page). "Sub-page vs
   hanging card" stops being authored and becomes how far the visitor pushed it.
3. **Two link kinds:** **Portal** (has a destination page; full ladder) and
   **Pocket** (no page — a footnote/aside; peek → keep only).
4. **Preview-first by default; the toy is opt-in** via pinning — the resolution of
   the calm-vs-tactile tension.

---

## Why

A reading-first site and a physics toy can coexist if play is *summoned* rather
than ambient: the box reads like gwern; the cards appear only when the visitor
peeks/pins. This keeps the portfolio-of-craft identity (the interaction is the
art) while making the reading genuinely calm.

## Trade-offs / rejected

- **Supersedes v1's "every page is a card swarm" identity.** ADR-0001's physics
  world is reused as primitives, but the page-as-swarm framing is retired. Large,
  but the point of v2.
- **Over-cursor previews rejected** for side-positioned-with-hover-bridge —
  over-cursor occluded the source text and fought "reading wins" (spec §4).
- **Box-as-physics-body rejected** — a scrollable readable surface and a
  jostleable body are near-contradictory (spec §6).

## Consequences

- Defines the v2 vocabulary added to `CONTEXT.md` (Ladder, Portal, Pocket, content
  box, preview/pinned card, …).
- The interaction layer (peek/keep/enter state machine, side-positioned preview,
  hover-bridge, title-bar card chrome) is **greenfield** (spec §14).
- Gravity-always-on, the **Tether** rope model, per-route **Cardinal** gravity,
  and the static-body world (ADR-0001) are **reused** as the physics substrate.
- Companion decisions: ADR-0006 (word-anchored tethers), ADR-0007 (retire
  transitions), ADR-0008 (progressive-enhancement escalation).
