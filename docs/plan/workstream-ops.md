# Workstream — Ops

Deploy, launch verification, and hygiene debt. Small in hours, disproportionate in
consequence: this is the stream where a missed item is visible to every visitor on
day one.

**Pieces:** WP-01 board staleness verification · WP-02 prod launch hygiene +
deploy dry-run · WP-12 housekeeping · WP-14 launch checks, rehearsal, go-live
**Budget:** ≈24 h of the ≈155 h scope total.

**Everything touching the Hetzner box is confirm-first and human-gated** — `make
deploy*`, `make assets-sync`, any `ssh chaipalaka`, any rsync whose destination is
the server. Modifying anything under `deploy/` that affects production is
**propose-then-apply**. No exceptions, no loop or subagent does it autonomously.

---

## WP-01 · Board staleness verification · M0 · 4–7 h · **first item in the plan**

A timeboxed sweep giving each of the 19 board items a dated verdict (`live` /
`stale` / `partly stale` / `premise unchecked`), with three getting real work:

- **TASK-035's four symptoms, individually**, against current `main` under drift.
  Chai believes it stale (A11, `[leaning]`); nobody has checked. The symptoms were
  observed on `/test/box` during task-028 dev review, **before** the drift
  conversion landed (042.01–.04, 2026-07-01→03), so drift may have fixed all, some
  or none. Verify **per-frame or by a conserved invariant** — a single-frame
  snapshot of a soft system is meaningless.
- **The brief's own unverified interviewer reading** — that `PinnedCard.parkAt`'s
  reduced-motion branch places a top-parked card at `edgeAnchor.y + parkRest`,
  *inside* the box over the prose, while the non-reduced path lets prose repel
  settle it outside. **Confirm or refute; do not inherit it as fact.**
- **DRAFT-006's premise**, the one confirmed-stale instance: a parked card
  "hangs and swings as a live physics pendulum off the box", but ADR-0010 set
  engine gravity to `{0,0}` on every route. There is no pendulum. Decide whether
  the underlying concern (parked-card *feel* under drift) survives.

**Why it goes first.** Everything downstream is scheduled against board claims.
Five hours to learn which are true is the cheapest insurance available, and it is
the only item whose *result* can invalidate the plan around it — its output is
**TRIGGER-A**, not a document.

**Findings are pinned onto the consuming tasks**, not left in a doc: hard
requirements become `--ac` on the dependent task, pointers become
`--append-notes`. Never `--desc`/`--notes`, which replace the whole field.

---

## WP-02 · Prod launch hygiene + deploy dry-run · M0 · 6–10 h

Four launch-visible defects and one dry run, batched because they touch the same
two files and the same human gate. **Three of the four were found by inspection,
not from the board or the brief.**

### 1 · The 404, both halves (≈3 h)

- `deploy/Caddyfile` has a bare `file_server` and **zero** `handle_errors` blocks,
  so an unknown URL returns Caddy's default 404.
- **And there is no 404 page to serve.** The prior `web/dist/` contains no
  `404.html` and no `404/` directory — `vite-react-ssg` never prerenders the splat
  route. The 404 component exists in `App.tsx` as a client route only.
- So the fix is two-sided: get SSG to emit a static 404, *and* add the Caddy block
  that routes to it.
- **Also add a `try_files` fallback.** Without one, any client-only route returns
  Caddy's 404 in production — which is why `/sandbox/cards` (filtered out of
  prerender but still a client route) is already dead in prod today.

*Verify:*
```sh
ls web/dist/404.html || ls web/dist/404/index.html
curl -s https://www.chaipalaka.com/nope-$RANDOM | grep -q 'data-server-rendered'
```

**`deploy/` changes are propose-then-apply.**

### 2 · Dev-route disposition (≈1 h)

`web/vite.config.ts:170–174` filters only `!p.startsWith('/sandbox/') ||
p.startsWith('/sandbox/scenes/')`, so `/test/*`, `/test/box-b`, `/lab` and
`/sandbox/scenes/*` ship as **real static directories** — confirmed against a prior
build. A one-line filter change executes whatever Chai rules (**O5**); the default
disposition is in [`open-questions.md`](open-questions.md) §T7.

*Verify:* `ls web/dist/test web/dist/sandbox` — absent for every route ruled hide.

### 3 · Sitemap (≈1.5 h)

`web/src/blog/vite-plugin-feeds.ts:118` hardcodes
`const staticRoutes = ['/', '/blog']`. The emitted `dist/sitemap.xml` carries
exactly **4 URLs**. `/lifelog`, `/stuff`, `/stuff/flash`, `/lab` — and `/about`
and `/claude` once they exist — are never listed. On a launch whose point is "real
URLs, real text, real shareability", half the site is invisible to crawlers.

Derive the list from the real public route set, add a test, and re-check after (2)
so hidden dev routes stay out.

*Verify:* `grep -c '<loc>' web/dist/sitemap.xml` ≥ the public route count, and
`grep -c '/test/\|/sandbox/' web/dist/sitemap.xml` = 0.

### 4 · Canonical host (≈0.5 h)

The Caddy site block is `chaipalaka.com, www.chaipalaka.com` with **no redirect
between them**, while `vite.config.ts:142` sets the feed/sitemap `baseUrl` to
`https://chaipalaka.com` and `make deploy-web` echoes `https://www.chaipalaka.com`.
Duplicate content on two hostnames and no agreed canonical. Pick one, redirect the
other, make the `baseUrl` match.

### 5 · Deploy dry-run (≈2.5 h)

`make deploy-web` + `make assets-sync` end-to-end against the real box with the
existing payload — **human-gated** — ending in the live-host `curl` that settles
the flash question ([`workstream-content.md`](workstream-content.md) WP-09):

```sh
curl -s -o /dev/null -w '%{http_code}' \
  https://www.chaipalaka.com/assets/ruffle/nightly-2026-05-12/ruffle.js
```

Also drafts `docs/process/launch-checklist.md`.

**Blocks:** WP-09, WP-14.

---

## WP-12 · Housekeeping · M4 · 3–5 h

- **TASK-031** — delete ~90 stale local branches, each confirmed obsolete rather
  than blind-deleted (the 2026-06-09 history rewrite orphaned most). Local only;
  remote deletions need explicit confirmation.
- **TASK-032** — triage and close stale GitHub issues with a pointer to the board.
  **Every `gh` write is human-gated**, and `gh` HTTPS writes fail TLS in the
  sandbox (`OSStatus -26276`) — run each with the sandbox disabled, per call.

**Parked in M4 deliberately.** Brief §4 fairly notes that the plan "spends hours
deleting git branches while the pin feature's documented bug goes unverified". The
answer is sequencing, not overriding Chai's Q14 triage: WP-01 is first in the plan
and this is last, where it competes with nothing and cannot destabilise anything.

---

## WP-14 · Launch checks, rehearsal, go-live · M4 · 5–9 h

**Launch infrastructure is not a project.** Brief §3 is right: Caddy, the systemd
unit, the API service and the deploy targets all exist and work. The coming-soon
page is a stale deployed *artifact*, not a configuration problem. The remaining
risk is **pipeline rust**, not construction.

### 1 · Rehearsal, ~2026-09-19 (one week before launch)

A full human-gated `make deploy-web` + `make assets-sync` to a state Chai accepts
being briefly public (or behind a temporary Caddy guard — Chai's call; any
Caddyfile change is propose-first). Proves rsync, TLS, `/api/*` and the asset path
**before** it matters. Launch day is not the day to discover the pipeline.

### 2 · Rollback artifact — before any overwrite

Copy the previous `/var/www/chaipalaka` aside on the box before overwriting. One
`cp -r`; cheap insurance, and **the coming-soon page is a genuinely usable floor**.

### 3 · Launch checklist

- RSS (`/rss.xml`) valid and non-empty.
- Sitemap matches the real public route set — **which WP-02 changed**.
- OG tags render on every route.
- No-JS floor on every content-box route (ADR-0004/0008): CSS the pre-hydration
  floor needs must be head-loaded in `base.css` — a component-level
  `import './x.css'` code-splits and never loads without JS.
- Reduced-motion pass (`set media reduced-motion` then `reload`; the
  `prefers-reduced-motion reduce` form silently no-ops — confirm via `matchMedia`).
- `/api/*` liveness.
- Secret-scan from the repo root: **zero** matches.
- Prerender check: `data-server-rendered` present in `dist/index.html`.

### 4 · Go-live, 2026-09-26

Production deploy, then post-deploy verification on the **live host**: every public
route, mobile and desktop, the 404, and `/api/*`. **Hard freeze from 2026-09-24** —
verification and fixes only.

---

## Standing gates for this stream

- Secrets live in `/etc/chaipalaka.env` on the server (`deploy/SECRETS.md`) —
  never in the repo, never in the `web/` runtime.
- The frontend talks to `/api/*` only; the Hetzner IP lives in DNS / SSH config,
  never in frontend code.
- Anything cut is **visible on the board as deferred with a post-launch
  disposition** — silence on an item is a defect at launch as much as in planning.
