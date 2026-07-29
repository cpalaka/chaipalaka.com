# ADR 0013: Apex canonical host, a prerendered 404, and no SPA fallback

**Date:** 2026-07-28
**Status:** Accepted
**Task:** task-044 (prod-v1 launch hygiene) · decision O5 (`docs/plan/open-questions.md` §T7)
· relates to ADR-0004 (canvas no-JS fallback), ADR-0011 (`/lab` art surface)

## Context

Four production defects were found by inspecting `main` at `1d5bed6`, none of
them on the board or in the planning brief. They share two files —
`deploy/Caddyfile` and `web/vite.config.ts` — and one root cause: nothing tied
the set of routes the app declares to the set of routes it ships.

- The Caddy site block served `chaipalaka.com` and `www.chaipalaka.com` with no
  redirect between them, while `vite.config.ts` named only the apex in the feed
  and sitemap `baseUrl` and `make deploy-web` echoed `www`.
- `file_server` had no `handle_errors`, and SSG never prerendered the splat
  route, so an unknown URL got Caddy's default 404 — there was no 404 page to
  serve even if it had been wired up.
- `includedRoutes` filtered only on `/sandbox/`, so `/test/canvas`,
  `/test/plain`, `/test/box`, `/test/box-b`, `/lab` and `/sandbox/scenes/*` all
  shipped as real static directories.
- `buildSitemap` hardcoded `['/', '/blog']`, so the sitemap carried 4 URLs and
  omitted `/lifelog`, `/stuff`, `/stuff/flash` and `/lab`.

## Decision

1. **The apex `chaipalaka.com` is canonical.** `www` gets its own site block
   that `redir`s permanently to the apex. The feed/sitemap `baseUrl` already
   named the apex and does not change; `make deploy-web`'s echo does.
2. **`/404` is prerendered and served by Caddy `handle_errors` with the 404
   status preserved** (`file_server { status 404 }` — `file_server` alone would
   answer 200).
3. **No SPA `try_files` fallback.** Every public route is prerendered, so a URL
   that misses is genuinely absent and says so. This is the reason
   `/stuff/flash/:slug` — the last client-only public route, and dead in prod
   until now — is expanded from `content/stuff/flash/` into the prerender set.
4. **Dev routes ship nowhere; `/lab` stays public** (decision O5). `/test/*`
   and `/sandbox/*` stay reachable under `npm run dev` and are dropped from the
   build. `/lab` is an ADR-0011 art surface and remains public and listed.
5. **The prerender set and the sitemap are derived from one source** —
   `web/src/site-routes.ts`, walking the route tree `App.tsx` declares. The
   sitemap moved out of `vite-plugin-feeds` into `ssgOptions.onFinished`, the
   first build hook that sees the resolved route set.

## Why

A hardcoded route list in two files is what produced both the unlisted-routes
bug and the shipped-dev-routes bug, and it would have produced them again the
first time `/about` or `/claude` was added. Deriving from the declared tree
makes "add a route" a single edit, and the derivation is pinned by tests that
run against the real `App.tsx`, not a fixture.

The SPA fallback is refused for the same reason it is usually adopted: it makes
every URL return 200. On a launch whose point is real URLs and real
shareability, a soft 404 that crawlers index as a real page is worse than a
missing page. Prerendering the one remaining client-only route costs less than
the fallback would.

## What the pre-merge review changed

The first cut of this decision was verified only against URLs matching **no**
route. URLs that match a route with an unknown *param* behave differently, and
three defects came out of that gap:

- **A partial match still renders its own route.** Caddy serves the 404 shell
  and a 404 status at `/blog/<typo>`, but the client router resolves it to
  `BlogPostReader`, which returned `null` — a blank content box.
  `FlashDetail` redirected to the gallery, discarding the requested URL under a
  404 response. Both now show the 404; `/stuff/flash/:slug` can render
  `NotFound` in place because it shares `CanvasLayout` with it, while
  `/blog/:slug` says the same thing as prose (`src/routes/notFoundCopy.ts` is
  the single source of the wording) because floating cards over an empty
  content box would be the same blank page.
- **`/404` itself answered 200** — a soft 404, indexable as a real page despite
  being absent from the sitemap. Caddy now forces the status on that path too,
  and `robots.txt` disallows it.
- **The sitemap listed the redirect, not the page.** `dirStyle: 'nested'` means
  `file_server` 301s `/blog` to `/blog/`, so 11 of 12 entries advertised a hop.
  `toCanonicalUrlPath` emits the form the host serves 200 for.

## Trade-offs

- **Any future client-only route 404s in production** unless it is added to the
  prerender set. That is the intended tripwire, not an oversight — but it is a
  sharp one, and a route added with a `:param` that is not expanded from content
  will fail this way silently until someone visits it.
- **Every `:param` route needs its own not-found branch.** The host cannot tell
  a real slug from a typo, so it always serves the 404 shell — but the client
  router will still resolve the URL to that route's component, and whatever
  that component does for an unknown param is what the visitor sees. Returning
  `null` or redirecting are both wrong. This is a standing obligation on new
  param routes, and nothing enforces it automatically.
- **The canonical host is now written in three places** that no build step ties
  together: `web/vite.config.ts` (`SITE_BASE_URL`), `Makefile`, and
  `deploy/Caddyfile`. Unavoidable across three languages; a mismatch would show
  up as feed/sitemap URLs pointing at the redirecting host.
- **Serving one prerendered document at every missing URL creates a hydration
  mismatch**: the shell bakes in `/404` and the browser is at `/nope`. React 18
  does not patch a mismatch, it discards the hydrated root (#418 — the task-015
  failure mode, from the other direction). `FrameBar`'s path indicator therefore
  suppresses the check and corrects itself on mount. Any *other* element that
  renders the pathname during SSR will reintroduce the bug.
- `/404` is itself reachable at `/404/`, which is harmless but slightly odd. It
  is prerendered-but-unlisted, so it stays out of the sitemap.
- The www redirect means `/api/*` on `www` costs an extra hop. The frontend only
  ever calls relative `/api/*`, so nothing in the app pays it.
