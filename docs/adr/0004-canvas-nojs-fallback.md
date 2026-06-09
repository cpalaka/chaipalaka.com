# ADR 0004: Canvas routes ship a CSS-gated no-JS fallback, not prerendered cards

**Date:** 2026-06-08
**Status:** Accepted
**Task:** task-012
**Issues:** #84 (empty prerendered card content), #85 (blank canvas shell for no-JS)

---

## Context

Every canvas route (`/`, `/blog`, `/stuff`, `/lifelog`, `/test/canvas`)
prerenders an empty shell. **Card**s register into the `CardRegistry`
inside a `useEffect` (`Card.tsx`), which `renderToString` skips, so the
registry is empty at SSG time and `CardLayer` emits a bare
`<div data-physics-layer></div>`. `BackgroundCanvas` has the same shape —
its mode starts `'pending'` and only flips in an effect, so it returns
`null` during prerender and not even the per-scene `fallbackPng` is
emitted. Net: no crawlable card content (#84) and a blank background for
no-JS users (#85).

The written design record constrains the fix more than the issues alone
suggest. The PRD is **deliberately client-first** — "SSG with client-side
hydration. … No SSR runtime" (PRD:131) — and its graceful-degradation
axis enumerates no-WebGL / reduced-motion / screen-reader / touch, **not
no-JavaScript**. The one no-JS-shaped requirement is SEO crawlability
(US-75), scoped to the document-shaped routes and the shell
(title/description/OG), and already satisfied by the fully-prerendered
plain reader at `/blog/:slug/read`. So the task is not "achieve no-JS
physics parity"; it is "stop shipping a blank shell — give no-JS users
and non-executing crawlers a readable floor." Card content is
synchronously available at render time (eager MDX glob, module-static
`pageDef`s), so a prerendered prose fallback is possible without async.

Four options were weighed (task-012 body). The decision was made before
implementation per the task's design-pass requirement.

---

## Decision

Canvas routes prerender a **No-JS fallback** — static semantic prose plus
the default scene's background gradient — and hide it once JS hydrates.
**Card registration, the physics world, the `CardRegistry`, and the
`Director`/`CardLifecycle` machinery are not touched.** The live
client-first experience is unchanged; the fallback is a parallel,
read-only view that exists only in the prerendered HTML.

This is task-012's Option 3, and exactly what its AC #1 anticipates:
"card content **OR** a documented graceful no-JS fallback (prose +
fallback image)."

Three mechanism choices, each load-bearing:

1. **A CSS class-swap gates visibility, not `<noscript>`.** `index.html`
   ships `<html class="no-js">`; an inline `<head>` script removes the
   class before first paint; `base.css` hides `[data-nojs-fallback]` by
   default and shows it only under `.no-js`. JS users never see the
   fallback (the class is gone before paint); no-JS users keep it. This
   is hydration-safe — the fallback is real, identical server/client DOM,
   and the `.no-js` toggle is on `<html>`, outside React's `#root`.
   `<noscript>` with rich React children has ambiguous hydration
   behaviour (browsers parse its content as text when JS is on; React
   reconciles it as elements), which this avoids entirely.

2. **The no-JS background is the constant default scene, not the active
   one.** `active` is read from `localStorage` on the first client render
   (`useController` → `useState` initialiser), which differs from the
   server's always-default value and would tear hydration. The fallback
   uses a module constant (`flow-shader`, mirroring `useGallery`'s
   `defaultId`) so server and client first-render markup are identical.

3. **The background is an inline `background-image`, not an `<img>`.** A
   CSS `background-image` on a `display:none` box is not fetched, so JS
   users (who never see the fallback) pay zero bytes for it; no-JS users
   fetch it when `.no-js` reveals the box.

**Why not the other options:**

- **Option 1 (register at render time).** Reshapes the seam the whole
  transition system sits on: render-time store mutation fights
  `useSyncExternalStore`, `PhysicsWorld.registerById` throws on duplicate
  id under StrictMode, and the **Director** lifecycle assumes client
  timing (a `Spawning` **Card** never paints — undefined what state a
  prerendered card is in). Highest blast radius for a requirement the
  record does not make.
- **Option 2 (SSR-aware registry).** Preserves the client-first model but
  adds a second registration path that must stay in sync, and `/blog`
  builds its chain in an effect from an empty list, so blog would need
  extra per-route surgery to populate at SSG time.
- **Option 4 (bare `<noscript>` notice).** Delivers neither crawlable
  content (#84) nor a readable floor; under-delivers against the SEO/
  readability ethos.

---

## Consequences

### Code

- New `nojs/NoJsFallback.tsx`: the shared shell — plain-anchor section nav
  + a `data-nojs-fallback` container. Each canvas route renders it as a
  sibling of `<Page>` with hand-authored **static** content (never the
  live card `children`, whose effects would otherwise double-fire — e.g.
  Lifelog's `/api/*` panels). Its styling lives in `base.css`, not a
  JS-imported stylesheet — the latter code-splits into a chunk that only
  loads when JS runs, i.e. never for the no-JS users the shell targets,
  leaving them an unstyled (and, over the light gradient, unreadable)
  page. The shell carries its own opaque `--color-bg` backing so the prose
  stays legible over the background.
- New `routes/blog/BlogIndexFallback.tsx`: the post list, read directly
  from the module-scope `posts` (the live chain is empty at SSG). Links
  target `/blog/:slug/read` — the canvas post route is itself blank
  without JS, so it is not a usable no-JS destination.
- `BackgroundCanvas` always emits a `data-nojs-fallback` gradient div.
- `index.html` + `base.css` carry the `.no-js` gate; `BackgroundCanvas.css`
  styles the gradient div.

### Tests

- `NoJsFallback`, `BlogIndexFallback` unit tests (nav, links, dates,
  tags).
- `BackgroundCanvas.test.tsx`: the prior "returns null on first render"
  test — which encoded the #85 bug — is replaced by one asserting the SSG
  output carries the no-JS baseline (default-scene PNG) but not the live
  canvas layers.

### Docs

- `CONTEXT.md` gains the **No-JS fallback** term under Architecture.

### Out of scope

- **The pre-existing hydration mismatch (React #418) on all canvas
  routes.** Confirmed present on `main` before this change and unaffected
  by it; the prerendered fallback content still ships regardless. Worth a
  separate task.
- **The canvas post route `/blog/:slug`** (not in task-012's enumerated
  set). Its no-JS path is the existing `/blog/:slug/read` reader, which
  the index fallback links to.
- **Full no-JS physics parity.** The record is client-first by decision;
  the fallback is a readable floor, not a second implementation.
- **`aria-current` on the fallback nav.** The nav renders a self-link for
  the current route with no `aria-current`. The live `FrameBar` it
  parallels omits it too (it marks the active route with `data-active`, a
  styling hook), so the fallback matches the site's baseline; adding it
  would couple this route-agnostic component to routing. Left as a known
  nit.
