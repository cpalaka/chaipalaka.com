# prod-v1 launch plan — index

**Target: 2026-09-26 (FIXED). Capacity: ≈133 h @ 15 h/week over 8.86 weeks.**
**Authored: 2026-07-26 on `main` @ `1d5bed6`. Input: the frozen planning brief
(`v1-launch-brief.md`, 2026-07-26).**

prod-v1 = the first real production release. `chaipalaka.com` currently serves a
coming-soon page; launch replaces it with the finished site.

The brief is the complete planning input. This directory is the plan derived from
it. **The backlog board remains the single source of progress** — these documents
are the map, not the tracker (`backlog-core`: plan docs are scratch, the board is
truth).

| Doc | What it holds |
|---|---|
| [`milestone-map.md`](milestone-map.md) | M0–M4, absolute dates, **executable** exit criteria, per-milestone budget reconciliation, re-plan checkpoints |
| [`work-pieces.md`](work-pieces.md) | Every work piece, independently sized, with dependencies and confidence |
| [`workstream-build.md`](workstream-build.md) | Code — routes, physics, responsive layout, canvas |
| [`workstream-design.md`](workstream-design.md) | Per-route composition + the capstone (the protected stream) |
| [`workstream-content.md`](workstream-content.md) | Prose, flash catalogue, `/claude` docs, media pipeline |
| [`workstream-ops.md`](workstream-ops.md) | Deploy, launch checks, hygiene, board/branch/issue debt |
| [`risk-cut-register.md`](risk-cut-register.md) | **Ordered** cut list with firing triggers and **milestone residency** — the plan's primary control |
| [`open-questions.md`](open-questions.md) | All 9 brief §6 tensions + every other open tag: RESOLVED / DEFAULTED / OPEN, each with a cost-if-wrong and a forcing date |
| [`board-accounting.md`](board-accounting.md) | All 19 board items + 7 unticketed scope items: scheduled / deferred / killed |

## The one-paragraph version

The date is fixed and scope flexes (A18), so **cutting is the plan's main control
loop, not its contingency**. My independent re-estimate of the surviving MUST list
plus unticketed scope is **≈155 h of scope + ≈20 h of process overhead = ≈175 h
against 133 h available — 1.32× over**. The protected core is **TASK-030 (design
capstone) + general UX polish** (A23) and **every route working on mobile and
desktop** (A4). Everything else is ordered in
[`risk-cut-register.md`](risk-cut-register.md), each cut assigned to the milestone
whose budget it closes.

## Rolling wave

Task-level detail runs through **M1 (2026-08-16)** — TASK-043 to TASK-046 plus the re-pointed existing tasks. M2–M4 are held at work-piece
level and get task detail at the checkpoint that opens them, **from a fresh board
view on `main`** — creating tasks on a feature branch scans a stale ID space and
produces silent duplicate IDs (`backlog-core`). Every milestone boundary is a
re-plan checkpoint: reconcile actual vs budgeted burn, fire or stand down cuts,
then detail the next wave.

## What Chai must personally rule on

Six decisions, in [`open-questions.md`](open-questions.md), summarised as the
decision sheet at the end of that document. **O1 (lifelog mechanism)** gates the
biggest M1 piece and **O2 (content-authoring hours)** moves ±11 h; both should be
answered before 2026-08-02.

## Six repo findings that shaped this plan

Established by direct inspection of `main` @ `1d5bed6` on 2026-07-26 — not from
the board, the brief, or memory. Two of them **correct or extend** findings the
input carried.

1. **The production 404 never fires — and there is no 404 page to serve.**
   `deploy/Caddyfile` has a bare `file_server` and **zero** `handle_errors` blocks,
   so an unknown URL returns Caddy's default 404. *And* the prior build in
   `web/dist/` contains **no `404.html` and no `404/` directory** — `vite-react-ssg`
   never prerenders the splat route. So the fix is two-sided: emit a static 404
   *and* route Caddy to it. `file_server` also has no `try_files` fallback, so any
   client-only route (e.g. `/sandbox/cards`) 404s in production today.

2. **`/stuff/flash` is NOT provably dead — the input's diagnosis is wrong.** The
   brief-era finding (no `assets/` dir, no `.swf`, "the Ruffle runtime is itself an
   unsynced asset", "`assets-sync` has never carried a payload") was verified
   against the **git tree**, where `assets/` is invisible **by design** — it is
   gitignored, exactly as the project's own >1 MB rule requires. On this machine
   `assets/` exists: **33 MB, 4 `.swf` + 4 PNGs, and the Ruffle runtime at
   `nightly-2026-05-12`, the precise version `RuffleEmbed.tsx:3` expects.**
   `make assets-sync`'s guard would find a real payload. What is genuinely unknown
   is whether `assets-sync` has ever been *run against the box* — answerable only
   by a live-host `curl`, which is why that check survives as an acceptance
   criterion even though the diagnosis behind it does not.

3. **`driftScale: 0` is defeated at spawn — confirmed.** `CardImpl.tsx:90` computes
   `prefersReducedMotion() ? 0 : SPAWN_KICK * world.getDriftScale()`, and the
   comments at `:13–18` and `:87–89` state the cause outright: `usePageDef` has not
   zeroed `driftScale` at spawn time (`CardLayer` precedes `Outlet`).
   `PhysicsWorld.driftScale` defaults to `1` (`:102`), so a `driftScale: 0` route
   that is not reduced-motion still receives a full `SPAWN_KICK` of 4 and its cards
   land **off** the authored composition. task-042.04 fixed the reduced-motion
   *instance*; the class was left. **This gates the lifelog work.**

4. **Dev routes are prerendered, not merely reachable — confirmed.**
   `web/vite.config.ts:170–174` filters only `!p.startsWith('/sandbox/') ||
   p.startsWith('/sandbox/scenes/')`. The prior `dist/` proves the effect:
   `test/canvas`, `test/plain`, `test/box`, `test/box-b`, `lab` and
   `sandbox/scenes/` all ship as real static directories.

5. **NEW — the sitemap omits most of the public site.**
   `web/src/blog/vite-plugin-feeds.ts:118` hardcodes
   `const staticRoutes = ['/', '/blog']`. The generated `dist/sitemap.xml` carries
   exactly **4 URLs**. `/lifelog`, `/stuff`, `/stuff/flash`, `/lab` — and `/about`
   and `/claude` once they exist — will never be listed. On a launch whose whole
   point is "real URLs, real text, real shareability" (PRD), half the site is
   invisible to crawlers. Cheap to fix; nobody had recorded it. *(Silver lining:
   the dev routes are not in the sitemap either.)*

6. **NEW — apex and `www` both serve, with no canonical redirect.** The Caddyfile
   site block is `chaipalaka.com, www.chaipalaka.com` with no redirect between
   them, while `vite.config.ts:142` sets the feed/sitemap `baseUrl` to
   `https://chaipalaka.com` and `make deploy-web` echoes
   `https://www.chaipalaka.com`. Duplicate content on two hostnames, and the
   canonical host is not agreed anywhere. One Caddy line; folded into M0.

## Provenance

This plan is a **fresh authoring pass** synthesising two independently-authored
roadmaps (`eval/result-arm-3`, `eval/result-arm-4`) that were written from the
same frozen brief and graded blind. Neither was adopted. Where they conflicted,
the conflict is resolved explicitly rather than averaged — see
[`work-pieces.md`](work-pieces.md) § *Where the two input roadmaps disagreed*.
The eval branches were never merged: they carry colliding task IDs and their
commits live on the `eval/*` tags.

> ### ⚠️ The frozen brief is NOT in this repo — TASK-043, 2026-07-28
>
> This plan's stated input is `v1-launch-brief.md` (2026-07-26). It is **not in the
> working tree and not in git history** — `find` finds nothing, and
> `git log --all --diff-filter=A -- '*brief*'` is empty. It was never committed.
>
> **Consequence:** every `A<n>` and `Q<n>` citation across these documents — A4, A9,
> A11, A18, A19, A21, A23, Q7, Q9, Q12–Q17, and all of §6 — **cannot be verified from
> this repo.** They are the planning session's report of what was said, not quotable
> source.
>
> Two live examples, both from the TASK-043 sweep:
>
> - `risk-cut-register.md` asserts *"Chai picked 039 in Q15"*, and the sweep relayed
>   that to Chai twice as his own stated preference before discovering it was
>   uncheckable. He did not recognise it when asked.
> - **A11's "board staleness is systemic and unquantified"** is the premise M0 exists
>   to test. The sweep found the board **mostly live** — 8 of 10 open tasks accurate —
>   partly refuting it. An unverifiable premise drove a real milestone.
>
> **How to apply:** treat A/Q citations as secondhand. Where one is load-bearing for a
> decision, say so explicitly rather than presenting it as established, and prefer a
> fresh ruling from Chai over an inherited one. If the brief exists outside the repo,
> committing it (or an extract of its numbered answers) closes this gap permanently.
