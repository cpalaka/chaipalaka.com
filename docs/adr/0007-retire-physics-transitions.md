# ADR 0007: Retire the v1 physics route-transition system

**Date:** 2026-06-19
**Status:** Accepted — implemented in task-025 (2026-06-20)
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

---

## Spike result — hero-morph mechanism (task-019, 2026-06-19)

**Chosen: (a) the browser-native View Transitions API**, driven by
`react-router-dom` 6.30's stable `viewTransition` Link prop + `useViewTransitionState`
hook (it calls `document.startViewTransition` internally and guards on support).
The clicked card and the destination content box share a `view-transition-name`
(set on the card only while its nav is in flight, via `useViewTransitionState`, so
sibling cards never collide on the name); the browser captures old/new snapshots
and morphs one into the other.

**Why this over the alternatives:**
- **(b) `react@experimental` `<ViewTransition>` — rejected.** Verified: React
  19.2.6 stable exports neither `ViewTransition` nor `unstable_ViewTransition`.
  Adopting it requires `react@canary`/`react-dom@canary` — a toolchain-pin change
  that collides with the `vite-react-ssg` peer-dep discipline (CLAUDE.md), and
  canary's React runtime drives the SSG prerender itself. Disproportionate cost
  for one morph when (a) gives the same shared-element capability with no React
  dependency.
- **(c) `canvas/flip.ts` FLIP — kept as a fallback option, not the primary.** It
  is a *single-element* rect-tween (position/scale/opacity) and cannot crossfade
  two *different* contents (card vs box). It works on every browser, so it remains
  available as an enhanced fallback if a future slice wants animation on non-VT
  browsers; for now the plain-nav fallback is sufficient.

**Verified in the spike** (`web/src/routes/spike/`, throwaway — delete with the
slice; routes `/spike/morph` + `/spike/morph/:id`), against the **prod
`vite-react-ssg` build** served via `vite preview`, in Chromium:
- Card→box morph runs on a real react-router client navigation
  (`document.startViewTransition` fires once per nav; dest box carries the shared
  `view-transition-name`). Prerender-safe — VT is runtime-only, post-hydration;
  the spike index prerenders (`dist/spike/morph/index.html`).
- **Fallback**: with `document.startViewTransition` removed (simulating an
  unsupported browser), react-router degrades to a plain client nav — destination
  renders, no morph, no error.
- **Focus + SR**: focus moves to the destination content-box `<h1>` (mirrors
  `BlogIndex`'s focus-follow); a **persistent** `aria-live="polite"` region in the
  route layer announces the route change. Both survive the morph (the VT snapshot
  is a visual overlay; the a11y tree reads the live DOM) **and** the fallback path.
  Note: the data router does **not** auto-announce navigations — the retirement/
  build-out slice must ship a real route announcer (none exists in the app today).

**Implications for the retirement/build-out slice:**
- `prefers-reduced-motion` is handled per-motion in CSS
  (`@media (prefers-reduced-motion: reduce) { ::view-transition-* { animation: none } }`),
  per ADR-0008 — there is no central `TransitionDirector` to host it.
- Use `react-router`'s `<Link>` directly (the codebase convention); the
  `viewTransition` prop requires the data router, which `vite-react-ssg` already uses.
- `router.back()` / browser back-forward do **not** trigger view transitions
  (popstate is synchronous) — the physical default covers those navs anyway.

---

## Implementation (task-025, 2026-06-20)

Shipped exactly the spike approach:

- **Retired** the whole `web/src/transitions/` subsystem (Director, dispatch,
  classifyDirection, PageDefRegistry, the four primitives, `transitionOverrides`,
  `TransitionSpec`, + tests). `PageDef` collapsed to `= PageSpec`; both layouts
  dropped the Director + registry; the four routes dropped `useRegisterPageDef`.
  Blog section pagination's `useHashSection`/`parseSectionHash` were *relocated*
  (not deleted) to `routes/blog/hashSection.ts`, decoupled from the Director — a
  section change now just re-renders the chain (no animation). The orphaned
  `routes/pageDefs.ts` aggregation went too.
- **Hero morph** (`web/src/nav/morph.ts` → `useMorphSource` /
  `useMorphDestination`): `PreviewCard` / `PinnedCard` swapped
  `window.location.href` for `navigate(href, { viewTransition: true })`.
  **Key subtlety (cost a debugging round):** the shared
  `view-transition-name: morph-hero` is NOT driven by `useViewTransitionState` —
  that hook matches a transition's *from* AND *to* location, so the **source**
  content box (path = the from-location) claims the name alongside the clicked
  card at the old snapshot → two elements, one name → Chrome aborts the
  transition and swaps instantly. Instead an explicit **morph-target signal** (a
  module `Controller` holding the path being morphed into) names source vs
  destination unambiguously: the card is named only while it has not yet arrived
  (`target === to && pathname !== to`, old snapshot only), the box only when it
  IS the target (`target === pathname`, new snapshot only); `enter()` `flushSync`s
  the card's name on before navigating. The target is never cleared on the route
  change — every clear races the destination snapshot capture (a route-change
  effect fires inside react-router's `flushSync`; a `requestAnimationFrame` fires
  mid-transition — both before the new snapshot) — it is overwritten by the next
  `enter`. Verified in-browser that the morph-hero group animates its full
  (slowed) duration and `transition.ready` resolves.
- **Physical default**: `viewTransition` on the FrameBar chrome links → a root
  crossfade in `base.css` (the directional slide is deferred to the task-030
  capstone). Reduced-motion + morph timing (340ms, matching `flip.ts`) are CSS in
  head-loaded `base.css`. A **direct Portal word-click** also takes the physical
  default: `PortalNav` (`web/src/nav/PortalNav.tsx`) delegates clicks on raw
  prose `<a data-link-type="portal">`, upgrading the unmodified desktop left-click
  from a full reload to `usePhysicalNav` (a client crossfade) — the `<a href>`
  stays real for no-JS / crawlers / open-in-new-tab, and touch tap still peeks.
- **A11y**: a persistent `RouteAnnouncer` (aria-live) mounted in both layouts;
  `ContentBox` moves focus to the destination `<h1>` (`tabIndex=-1`) on route
  change. Both verified to survive the morph and the no-VT fallback.
- The task-019 spike (`routes/spike/*`, `/spike/morph`) was deleted with the slice.
- Demo surface: a second content-box route `/test/box-b` is the morph destination
  for `/test/box` (the `/blog` content-box rollout is task-026).
