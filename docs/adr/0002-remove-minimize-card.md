# ADR 0002: Remove the minimize-card feature

**Date:** 2026-05-13
**Status:** Accepted
**Supersedes:** ADR-0001 §10 (cascade-minimize); partially ADR-0001 §11
(the `MinimizedRegistry parent/child tracking` consequence bullet)
**Issues:** #118 (removal)

---

## Context

The minimize-card feature was an early prototype of the foreground
interaction model:

- A `−` button in the card header called
  `MinimizedRegistry.minimize(id, …)`.
- The card's DOM unmounted; a chip appeared in the frame-bar strip with
  a FLIP morph from the card's source rect.
- Clicking the chip restored the card with the reverse FLIP morph.
- ADR-0001 §10 layered a cascade behaviour on top: minimizing a parent
  also minimized its entire strung subtree atomically, with the chip
  showing a `+N` badge.

The May 2026 Swiss-grid redesign sharpened the design direction
("restrained brutalism") and reframed the foreground as gravity + drag
+ route-change. During an `/improve-codebase-architecture` grilling
session on 2026-05-13 (Candidate 4 thread (b) in
`docs/architecture-deepening.md`), the cascade-minimize encoding in
`MinimizedRegistry` was found to have zero production callers —
`registerString` and `unregisterString` were only called from tests.
The user-facing feature still worked, but the cascade half of
ADR-0001 §10 had been silently unwired for an unknown duration.

That made the surface a type-complete-but-unfired feature — the most
expensive kind of code for AI-driven navigation to reason about,
because it looks load-bearing without being so.

---

## Decision

The minimize-card feature is removed entirely. No replacement.

- `MinimizedRegistry`, `useMinimizedRegistry`, `useIsMinimized`, the
  per-card minimize button JSX, the `minimizable` prop on
  `PhysicsCard` / `PhysicsCardImpl`, the FLIP-morph restore-from-chip
  effect, the `MinimizedChip` component, and the chip-strip region in
  `FrameBar` are all deleted.
- The frame bar carries: site name, current-page indicator, section
  nav, settings menu (background / colour mode / frame edge). The
  minimized-card strip is gone.
- Route-change is the only dismissal. Cards stay on screen for the
  duration of a route's visit.

**Why:**

1. The cascade-minimize behaviour from ADR-0001 §10 was never wired in
   production (`registerString` / `unregisterString` had zero
   non-test call sites for an unknown duration). The feature looked
   complete from the type system's perspective but didn't fire.
2. The dismissal need the feature solved isn't real for this site —
   gravity + drag + route-change is the entire interaction the
   foreground needs.
3. The chip strip adds frame-bar chrome the restrained-brutalism
   design direction doesn't want.
4. Carrying a feature whose code looks complete but doesn't fire
   creates an AI-navigability trap — agents reading the code can't
   distinguish "load-bearing" from "vestigial" without running it.

**Rejected:** Wiring `registerString` / `unregisterString` properly to
make cascade-minimize fire in production. This was the obvious
counter-move (fix what's broken instead of removing it), but reasons
2–3 still hold even after a wiring fix: the feature itself is
unwanted, not just buggy.

---

## Consequences

- ADR-0001 §10 is superseded. The historical decision stays intact in
  the ADR for chain-of-reasoning preservation; only a `Superseded`
  stamp is added.
- ADR-0001 §11's `MinimizedRegistry parent/child tracking` consequence
  bullet is also superseded.
- `PRD.md` § "Frame bar + minimize — `FrameBar`, `MinimizedRegistry`"
  is rewritten as § "Frame bar — `FrameBar`"; narrative mentions of
  minimize / chip / FLIP morph elsewhere in the PRD are surgically
  removed.
- `CONTEXT.md`'s **Controller** entry drops `MinimizedRegistry` from
  the production examples list.
- Issue #117 (Controller bridge) refactors three Controllers instead
  of four (`BackgroundGallery`, `FrameEdgeController`,
  `ThemeController`). The original four-Controller scope was amended
  on 2026-05-13.
- A future dismissal-card feature (if it surfaces) is a new design
  conversation — this ADR does not constrain it.
