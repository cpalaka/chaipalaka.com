# Launch checklist — prod-v1

> Drafted in **task-044** (M0). It is **executed in M4**, immediately before
> go-live, not here. Nothing in this file is checked off by the task that wrote
> it.

This is the pre-go-live pass over the *deployed* site. It is deliberately
separate from `local-verification.md`, which gates a commit: everything here
runs against `https://chaipalaka.com` after a real deploy, because a green
build has never been evidence that the box serves what the build produced.

Every server-touching step is **confirm-first and human-gated** — `make
deploy*`, `make assets-sync`, any `ssh chaipalaka`, any `rsync` to the box.

Set once per run:

```sh
BASE=https://chaipalaka.com
```

## 1 · Prerender and hosting

- [ ] **Prerender intact.** `curl -s $BASE/ | grep -c 'data-server-rendered'`
      returns 1. Repeat for `/blog/`, `/lifelog/`, `/stuff/`, `/lab/`.
- [ ] **404 is the bespoke page AND carries a 404 status.** Both halves — a 200
      here is the soft-404 failure ADR-0013 exists to prevent:
      ```sh
      curl -s -o /dev/null -w '%{http_code}\n' $BASE/nope-$RANDOM   # 404
      curl -s $BASE/nope-$RANDOM | grep -c 'data-server-rendered'   # 1
      ```
- [ ] **No hydration error on the 404.** Load a missing URL in a real browser
      and confirm the console/errors buffer is clean. React 18 discards the
      hydrated root on a mismatch (#418) and the 404 shell is the one document
      served at URLs it was not rendered for — see ADR-0013's trade-offs.
- [ ] **Canonical host.** `curl -sI https://www.chaipalaka.com/blog/` returns
      301 to the apex with the path preserved.
- [ ] **A URL that matches a route but not a slug also shows the 404.** Not the
      same check as an unmatched URL — the client router resolves these to the
      real route component, and a wrong not-found branch renders a blank page:
      ```sh
      curl -s -o /dev/null -w '%{http_code}\n' $BASE/blog/no-such-post/   # 404
      curl -s -o /dev/null -w '%{http_code}\n' $BASE/stuff/flash/no-such/ # 404
      ```
      Then load both in a browser: each must *say* the page doesn't exist, keep
      the URL that was requested, and offer a way out.
- [ ] **`/404` itself answers 404, not 200.** `curl -sI $BASE/404/` — a 200 here
      is a soft 404 a crawler will index.
- [ ] **`robots.txt` is served** and names the sitemap.
- [ ] **Dev routes are gone.** `/test/box/`, `/test/box-b/`, `/test/plain/`,
      `/test/canvas/`, `/sandbox/cards`, `/sandbox/scenes/*` all return 404.
- [ ] **`/lab` is live** (ADR-0011) — 200, and the aura layer renders.
- [ ] **The 404 handler does not hijack the API.** With the Bun service up, a
      404 from `/api/*` must return the API's own response, not the site's 404
      page — `handle_errors` fires on Caddy errors, and an upstream 404 through
      `reverse_proxy` is not one, but this was only ever validated against a
      static `dist/`.

## 2 · Feeds and discoverability

- [ ] **Sitemap matches the real public route set.**
      `curl -s $BASE/sitemap.xml | grep -c '<loc>'` is at least the public route
      count, and `grep -c '/test/\|/sandbox/'` is **0**.
- [ ] **Every sitemap URL resolves.** No 404s, no redirects:
      ```sh
      curl -s $BASE/sitemap.xml | grep -o '<loc>[^<]*' | cut -c6- \
        | while read -r u; do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "$u")" "$u"; done
      ```
      Derive the verdict from the output — do not print a pass line beside it.
- [ ] **RSS validates.** `$BASE/rss.xml` parses, and no `draft: true` post
      appears in it or in the sitemap.
- [ ] **OG tags per route.** Each public route has a title, description and
      image that are its own, not the site default.

## 3 · Progressive enhancement and accessibility

- [ ] **No-JS floor per content-box route** (ADR-0008). With JS disabled, `/`,
      `/blog/`, `/blog/<slug>/` and `/blog/<slug>/read/` still render readable
      prose. Canvas routes show their CSS-gated fallback (ADR-0004) — note that
      component-level `import './x.css'` code-splits and never loads without JS,
      so fallback CSS must be head-loaded.
- [ ] **Reduced-motion pass.** With `prefers-reduced-motion: reduce` emulated
      *and the page reloaded*, drift stills and no card animates. Confirm via
      `matchMedia`, not by assuming the emulation took.
- [ ] **Keyboard reachability.** Every ladder link and card action is reachable
      and visibly focused.

## 4 · Backend and assets

- [ ] **`/api/*` is live.** Each endpoint the site calls returns 200 with real
      data, not a cached fixture.
- [ ] **Flash assets served.** `curl -s -o /dev/null -w '%{http_code}'
      $BASE/assets/ruffle/nightly-2026-05-12/ruffle.js` returns 200, and one
      `.swf` loads and plays through `RuffleEmbed`.
- [ ] **`make assets-sync` payload is on the box** — `assets/` is gitignored by
      design (>1 MB rule), so a repo check proves nothing here. Settle it with a
      live request.

## 5 · Hygiene

- [ ] **Secret-leak scan** from the repo root — the grep in
      `local-verification.md`, expecting **zero** matches.
- [ ] **No debug instrumentation** in shipped code (`console.log`, scaffolding).
- [ ] **Caddyfile applied and validated.** `sudo caddy validate --config
      /etc/caddy/Caddyfile` before `systemctl reload caddy`, and the deployed
      file matches `deploy/Caddyfile` in the repo.
