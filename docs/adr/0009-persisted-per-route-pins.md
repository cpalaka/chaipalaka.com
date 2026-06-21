# ADR 0009: persisted per-route pins via href-locators, describer-pull, root-only

**Date:** 2026-06-20
**Status:** Accepted (implemented — task-028)
**Task:** task-028
**Spec:** `docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md` §7
**Builds on:** ADR-0005 (link ladder / content box), ADR-0006 (word-anchored tethers)

---

## Context

v2.0 shipped the Keep rung as **ephemeral**: pinned cards lived only on a route
for that visit; a reload or return returned to the PageDef resting state. Spec §7
deferred persistence to a v2.1 fast-follow "because that is where the staleness
bugs live." This ADR records the design chosen for that fast-follow.

Two facts shaped it. (1) A pin's source is a live DOM `Element` (`PinEntry.sourceEl`)
— not serializable; it must be re-found on reload from a stable key. (2) The card's
**regime** and live position are not in `PinStore` — they live in `PinnedCard`'s
per-frame closures — so the store has no serializable runtime to read.

---

## Decision

1. **Word identity = a `href` + occurrence-index locator.** Both Portal and Pocket
   sources are `<a href>` (Portal target / `#user-content-fn-N`), so `href` keys
   both; `nth` (index among same-href Ladder triggers in the content box)
   disambiguates duplicates. Pure `pin/pinLocator.ts` over the shared
   `peek/triggerSelector.ts` candidate set.
2. **Runtime via a describer pull, not per-frame write-back.** Each `PinnedCard`
   caches its `{regime, word-relative offset}` once per frame (reusing the
   word-anchor measurement the tick already does) and registers a describer with
   the store; persistence *pulls* it at save time. No extra renders, and — crucially
   — it works **mid-navigation**, when the outgoing route's source words have
   already left the DOM (the cached value survives; a live measurement would not).
3. **Root pins only.** Child/recursion pins (ADR-0001 §9) are not persisted; they
   re-keep inside a restored parent. Avoids parent-render-timing + id-remapping.
4. **Re-settle, not pixel-exact.** Restore re-hangs a pin at its word + saved offset
   and lets physics settle (parked regime via the existing auto-park path); no
   absolute-coordinate replay.
5. **Stale → drop silently.** A locator that no longer resolves drops the pin (no
   crash, no edge-park).
6. **Persisted wins.** A route with saved pins suppresses its ambient teacher
   (`useAmbientPins` checks `hasRoute`); ambient pins carry no locator, so they
   never persist themselves and never create a route key.

---

## Why

The locator keys on authored identity (`href`), so it survives content reordering
and only goes stale when a link is genuinely removed — exactly when we *want* to
drop. Describer-pull is what makes save correct across an SPA navigation, which is
the failure mode a naïve "measure on save" design hits. Root-only + re-settle keep
a fast-follow small and robust across viewport sizes, matching v2.0's existing
ambient-seed restore path.

## Trade-offs

- **Not faithful to a manual park whose word is still in the fold:** restore re-parks
  via auto-park, which keys off word-vs-fold at load (scroll-top), so a card the user
  drag-parked while its word was visible returns word-anchored. Accepted under the
  re-settle policy.
- **Payload is stored, not re-derived:** title/lead/bodyHtml are saved with each pin
  rather than re-resolved from the DOM/post-index on restore — simpler and
  self-contained, at the cost of going stale if the source content changes while the
  word stays. Schema-versioned (`v:1`) so a format change invalidates cleanly.
- **No user-dismiss exists yet**, so "emptying a route persists as empty" reduces to
  "a route is owned once it has ≥1 kept pin"; revisit if a dismiss gesture lands.

## Consequences

- New: `pin/pinLocator.ts`, `pin/pinPersistence.ts` (codec + `localStorage` IO under
  `chaipalaka.pins:<pathname>`), `pin/usePersistedPins.ts` (save→clear→restore
  lifecycle, hosted in `LadderReset`), `peek/triggerSelector.ts` (extracted shared
  const).
- Extends: `PinStore` (describer registry + `locator`/`initialRegime` fields),
  `PinnedCard` (cache runtime + describer + restore-into-parked), `PreviewCard`
  (compute a locator on keep), `useAmbientPins` (persisted-wins guard). `LadderReset`
  delegates the pin half of the nav reset to the hook; peek stays ephemeral.

## Review fixes (task-028 diff review)

Two bugs found in review, both fixed here:

1. **Detached-word offset corruption (Decision 2 hardening).** On nav-away the source
   word detaches; `getBoundingClientRect()` then returns an all-zeros rect, which is
   *finite*, so the describer was caching `cardPos − (0,0)` = the card's **absolute**
   position instead of a word-relative offset (and the live translate-pair flung the
   card by the full `prev→0` delta). Fix: `trackWord` now rejects a **zero-size** rect
   (detached / `display:none`) as unmeasurable and skips the frame — so the cached
   offset holds its last good value across a nav. The physics world ticks on its own
   rAF, independent of React's save effect, so without this guard the corruption was a
   race (intermittent).
2. **No recovery from a wedged arrangement.** Because save fires on every exit and
   there is no dismiss gesture, a broken live position re-persists on each reload.
   Added an **escape hatch**: `pinPersistence.clearAllRoutes()` + a "Clear pinned
   cards" item in the FrameBar settings menu (gated by `usePinOptional`, since FrameBar
   also renders on the v1 canvas layout) that drops live pins and wipes all saved
   routes.

Out of scope (deferred to **task-035**): word-anchored pins are flaky under fast
scroll (the task-018 spike's predicted-but-uncaught failure) and parked cards can land
below the viewport; the parked-card offset is not word-meaningful (restore relies on
`parkAt`). That is auto-park/recall regime physics (task-024), not persistence.
