# ADR 0001: Gravity-always-on + strings/tether model

**Date:** 2026-05-10
**Status:** Accepted
**Issues:** #56 (implementation), #57 (per-route wiring), #58 (PRD/cleanup)

---

## Context

The original physics model had gravity as a user-toggle (off by default, on = 0.7y). Cards were either `locked` (static, pinned) or `free` (drag-and-stay). Notes were attached to parent cards via a `NotesChain` — a separate linear-chain abstraction with bezier connectors and a soft cap of 5.

During the May 2026 Swiss-grid redesign we wanted physics to feel more intentional and art-directed: each route should have a gravitational character rather than a sandbox the user opts into.

---

## Decisions and rationale

### 1. Gravity is always on; direction declared per route

**Decision:** The user-toggle (`setGravity(boolean)`) is removed. Gravity is always on. Each route's `PageDef` declares a cardinal direction (`'down' | 'up' | 'left' | 'right'`). Default: `'down'`. Magnitude: 0.7 (same as the previous ON value).

**Why:** A toggle means gravity is an opt-in gimmick. Always-on makes it load-bearing — the string topology becomes how the site communicates spatial relationships between cards. Routes can now have gravitational identity (home = grounded, 404 = everything floats away).

**Rejected:** Per-page magnitude (adds a knob with unclear use cases); arbitrary-angle gravity (most pages pick cardinals; adds complexity to the "where's the ceiling" question); mid-page scroll-triggered gravity changes (too complex for v1).

---

### 2. STRUNG / DETACHED replaces LOCKED / FREE; padlock removed

**Decision:** `CardInteractionMode` is removed. No padlock. Cards are either STRUNG (tether connects them transitively to a static body) or DETACHED (no tether; falls/floats freely).

**Why:** The padlock was a runtime override of the physics. With gravity always on, the tether IS the mechanism that keeps a card in place — making the padlock redundant and conceptually confusing. The binary now maps to a physical reality: does this card have a string?

**Rejected:** Three-state (locked + strung + detached) — adds complexity without UX gain; "locked = short stiff string" — technically unified but no visible benefit.

---

### 3. Strings are design-time per route (not runtime user actions)

**Decision:** String topology is declared in the route's `PageDef`. No UI for creating or destroying strings at runtime.

**Why:** Matches the art-directed intent. If the user could restring cards, the gravitational identity of each route would dissolve. Gravity direction is also not user-configurable — strings follow the same contract.

---

### 4. Strict tree topology — one parent per card

**Decision:** Each card has at most one parent (`'ceiling' | 'floor' | <cardId>`). Multiple children per card are fine. Topology is a forest of trees.

**Why:** Trees are simpler to author, reason about, and render (no cycles, no multi-parent rendering ambiguity). Multi-parent triangulation is a future extension if needed.

---

### 5. Inextensible rope semantics (not springs, not rigid rods)

**Decision:** Tethers are ropes — slack OK when card is closer than max length; pull-only when at length; never extend past length.

**Why:** Ropes feel physically correct for "hanging from a ceiling" or "balloon on a string." Springs (what NotesChain used) oscillate and feel bouncier. Rigid rods prevent the card from approaching the anchor at all, which would feel mechanical and prevent natural settling.

**Implementation note:** matter.js has no native one-sided constraint. Approximated via per-tick pull-only force (applied only when `distance > length`), or via a stiff bilateral constraint with visual taut/slack rendering based on measured distance. Implementer picks.

---

### 6. Layout determines string length; cards rest at layout positions

**Decision:** Tether length = `distance(parentAnchorPos, cardLayoutPos)`. Not declared per-card. Cards rest at their `CardLayout` positions when taut.

**Why:** Preserves the load-bearing "anchor positions ARE the layout" principle (PRD:365). Degradation path (no physics → just the grid) is unchanged. Authors don't need to specify lengths — the layout IS the rest configuration.

---

### 7. Two static bodies (ceiling + floor) plus side walls

**Decision:** The physics world always has: a ceiling at y = frameBarHeight, a floor at y = viewport.height, and two invisible side walls at x = 0 and x = viewport.width. All resize-aware.

**Why:** With gravity always on and cards able to be detached, the world must be bounded. Floor catches falling heavy cards; ceiling catches floating balloon cards; side walls prevent off-screen drift from flings.

**Replaces:** The single floor-only static body from the original implementation.

---

### 8. Buoyancy per card-type (not per instance or per page)

**Decision:** `kind: 'note'` → balloon (per-tick force opposite gravity). All other kinds → heavy. Per-instance override allowed as an escape hatch.

**Why:** Card type is the natural semantic grouping. Notes feel "lighter" — they annotate, they don't anchor. A per-page setting would prevent mixed heavy+balloon pages. Per-instance would bloat `PageDef` with boilerplate.

**Implementation note:** matter.js has no per-body gravity. Balloon force = `(-gravityVec.x * mass, -gravityVec.y * mass)` applied per tick.

---

### 9. NotesChain is removed; notes become first-class cards on strings

**Decision:** `NotesChain` (linear chain, bezier connector, soft-cap of 5, newest-closest topology) is removed. Daily notes are `kind: 'note'` balloon cards declared in the Lifelog route's `PageDef` with `parent: <lifelogCardId>`.

**Why:** NotesChain was a separate abstraction layered on top of physics for one specific content type. The generic string model handles the same spatial relationship more simply. The "soft cap of 5 + expand" affordance is not needed since notes are now regular cards in the standard physics world.

**Trade-off:** Loses the "curated chain of small notes" aesthetic (tight linear visual). Gains coherence — all content cards follow the same model.

---

### 10. Cascade-minimize

> **Superseded by [ADR-0002](0002-remove-minimize-card.md)** (2026-05-13) — the minimize-card feature was removed entirely. The decision below is retained for historical context.

**Decision:** Minimizing a parent card minimizes its entire strung subtree atomically. The frame-bar chip shows a `+N` badge when subtree size > 1. Restore restores the full subtree.

**Why:** If minimizing a parent left children hanging, they'd have no visual anchor and would either fall (confusing) or re-anchor to grandparent (surprising). Cascade-to-chip is the least surprising behavior and maintains spatial coherence.

---

## Consequences

- Issues #19 (gravity toggle) and #13 (notes-chain) are closed as superseded.
- Issue #24 (404 page) updated to use `gravity: 'up'` in its `PageDef`.
- `PhysicsWorld` public API changes: `setGravity(boolean)` → `setGravityDirection(Cardinal)`; `setStatic` and `setSensor` become internal.
- `PhysicsCard` drops `interactionMode` prop and padlock icon.
- `MinimizedRegistry` gains parent/child relationship tracking. (Superseded by [ADR-0002](0002-remove-minimize-card.md) — `MinimizedRegistry` is removed.)
- New module: `Tether` (built on existing `linkBodies`).
- New component: `<StringLayer>` SVG overlay.
- New type: `PageDef`, `CardSpec`, `Cardinal`.
