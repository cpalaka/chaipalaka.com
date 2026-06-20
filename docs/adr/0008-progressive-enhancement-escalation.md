# ADR 0008: v2 escalates progressive enhancement to a site-wide source-of-truth document

**Date:** 2026-06-19
**Status:** Accepted (design — implementation not started)
**Task:** task-017
**Spec:** `docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md` §11
**Extends (does not supersede):** ADR-0004

---

## Context

ADR-0004 established a **per-route** no-JS *floor*: canvas routes prerender a
readable prose fallback, but the PRD is "deliberately client-first — SSG + client
hydration, no SSR runtime," its degradation axis enumerates no-WebGL/
reduced-motion/SR/touch (not no-JS), and the only fully-prerendered prose surface
is `/blog/:slug/read`.

v2 (ADR-0005) makes every **content box** a dense reading surface whose links and
footnotes must be real, crawlable, SR-navigable content — because the **Ladder**
(previews, **Pocket** cards) *reads its content from the static DOM*. That is a
stronger posture than ADR-0004's floor.

---

## Decision

1. **The static prerendered document is the source of truth for every content-box
   route.** **Portal** links = real `<a href>`; **Pocket** content = real inline
   disclosures (`<button aria-expanded>` / `<details>`), present in HTML *and* RSS
   before any JS runs. No *content* lives only in physics-land.
2. **The physics/toy layer is a pointer+JS enhancement that reads from that static
   DOM** — and, per the governing principle, **the full toy takes precedence; PE is
   an additive floor, never a ceiling.**
3. The accessibility work the model *creates* is in scope, not deferred: a
   **focus-management** story (peek/pin/recall/morph), **Pocket = disclosure
   semantics** (not a styled `<a>`), and **reduced-motion gating of the physics
   sim** (which nothing does today — only the Director and BackgroundCanvas read
   `prefers-reduced-motion`).

---

## Why

A reading-first site that isn't readable without JS or a screen reader fails its
own thesis. Making the static document canonical also gives the enhancement a
clean source to transclude from.

## Trade-offs

- **Reverses the PRD's client-first posture for content routes.** They stay
  SSG-prerendered (not runtime-SSR), but the prerendered prose is now *canonical*,
  not a fallback. Extends ADR-0004 rather than superseding it.
- **New pipeline work, not reuse:** there is no footnote infrastructure today (no
  `remark-footnotes`/`remark-gfm`; the RSS generator ships *raw MDX*, so footnotes
  must render to HTML for `content:encoded`). Spec §11 / §18.2.

## Consequences

- New: the **Pocket** inline-disclosure render (a single authored MDX node → in-flow
  HTML + RSS + the card-lift hook), the RSS MDX→HTML render, the focus-management
  layer, and the reduced-motion gate on the sim.
- Reuses: the no-JS prerender path and the `/blog/:slug/read` reader (ADR-0004),
  generalized into the content-box static substrate.

## Implementation (task-021, the static-floor pipeline)

Decisions 1 + 3 above are shipped (no physics yet):

- **Footnotes:** `remark-gfm` parses `[^1]` syntax; a custom `rehype-pocket-footnotes`
  plugin rewrites each definition into a `<details class="pocket" data-pocket-id>`
  disclosure. The `data-pocket-id` + `.pocket__body` is the **card-lift hook** the
  ladder reads from the DOM. `<details>/<summary>` chosen over `<button aria-expanded>`
  so the floor toggles with zero JS (SR exposes native expanded state).
- **Links:** `rehype-link-types` marks prose `<a>` as `portal` (internal) or
  `external` (absolute http(s), gets `target=_blank rel=noopener noreferrer` + icon).
- **RSS:** option (a) — `vite-plugin-feeds` compiles the MDX body to HTML via the same
  two rehype plugins, so footnotes render in `content:encoded`. MDX **JSX components**
  (`Callout`, `Figure`) are not evaluated in the feed and drop out (known limitation).
- The same two rehype plugins run in both the page MDX pipeline (`vite.config.ts`) and
  the feed generator — one authored footnote → one disclosure everywhere.
