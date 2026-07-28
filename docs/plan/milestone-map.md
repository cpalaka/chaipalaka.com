# prod-v1 — milestone map

**All dates absolute. 2026-09-26 is FIXED; scope flexes (brief A18).**
Pace 15 h/week, capacity ≈133 h (brief §1 — pinned inputs, not re-derived).

Milestone boundaries land on Sundays; launch day 2026-09-26 is a Saturday.

| # | Window | Budget | Name | Exit criterion (one line) |
|---|---|---|---|---|
| **M0** | 2026-07-26 → **2026-08-02** | 15 h | **Ground truth** | The board is verified and production is provably deployable |
| **M1** | 2026-08-03 → **2026-08-16** | 30 h | **Routes filled** | No v1-styled page remains on any public route |
| **M2** | 2026-08-17 → **2026-08-30** | 30 h | **Mobile + content** | Every route usable on a real phone; the words are written |
| **M3** | 2026-08-31 → **2026-09-13** | 30 h | **Design capstone** | One coherent design system applied site-wide |
| **M4** | 2026-09-14 → **2026-09-26** | 28 h | **Launch** | chaipalaka.com serves prod-v1 |

Total 133 h. Each boundary is a **re-plan checkpoint**.

**The capstone is M3 of five, not last.** M4 is a launch window with 13 days of
runway behind the capstone. A protect-last item scheduled dead last is the first
thing squeezed by everything that ran over; the register cuts *around* M3 instead
(see [`risk-cut-register.md`](risk-cut-register.md) TRIGGER-F).

---

## Budget reconciliation — per milestone, not just in total

The brief's §7 requires sized pieces; a plan whose *total* closes while individual
windows are over-subscribed has not actually scheduled anything. Every milestone
below holds its own piece sizes, and each over-subscribed window names **the cut
that closes it**.

| M | Budget | Scope | Overhead | Loaded | Over | Resident cuts, in order | After |
|---|---:|---:|---:|---:|---:|---|---:|
| M0 | 15 | 13 | 2.5 | 15.5 | +0.5 | — | 15.5 |
| M1 | 30 | 30 | 5.0 | 35.0 | +5.0 | CUT-5 (−4), CUT-6 (−2) | 29.0 |
| M2 | 30 | 35 | 3.75 | 38.75 | +8.75 | CUT-7 (−8), CUT-4 (−4) | 26.75 |
| M3 | 30 | 26 | 1.25 | 27.25 | −2.75 | **none — protected** | 27.25 |
| M4 | 28 | 51 | 7.5 | 58.5 | +30.5 | CUT-1 (−18), CUT-2 (−12) | 28.5 |
| | **133** | **155** | **20** | **175** | **+42** | **48 h of cuts fire** | **127** |

**Overhead is not padding.** The project's DoD is six items ending in explicit
sign-off, plus a per-branch adversarial review, plus local diff review in VS Code —
about **1.25 h of wall-clock per board task**, across ≈16 tasks. The brief's
estimate table budgets zero for it.

Read the table as: the plan is **1.32× over** and closes by firing six cuts, none
of which touches the launch bar (mobile *layout*) or the protected capstone. CUT-3,
CUT-8 and CUT-9 (≈24 h) remain in reserve against the estimates being wrong, which
they will be somewhere.

**M1 grew by 1 h on Chai's O1 ruling (2026-07-26).** STRUNG short ropes need an
authored anchor topology that `driftScale: 0` would not have, so WP-03 sizes at 15 h
rather than ~12. CUT-6 joins CUT-5 as M1's resident cut to absorb it.

---

## M0 — Ground truth · exit **2026-08-02** · 15 h

The only milestone whose job is to make the rest of the plan trustworthy. A11
establishes that board staleness is systemic and unquantified; the brief's estimate
table is explicitly not a measurement; and this session's own verification pass
already overturned one launch-critical premise it inherited (see
[`README.md`](README.md) finding 2). **Nothing downstream should be scheduled on
unverified premises.**

**Contents:** board staleness verification sweep (TASK-043) · prod launch hygiene +
deploy dry-run (TASK-044).

### Exit criteria — all five must hold

1. **Every one of the 19 board items carries a dated verification verdict**
   (`live` / `stale` / `partly stale` / `premise unchecked`) in its notes.
   TASK-035's four symptoms are re-tested **individually** against current `main`
   under drift, and DRAFT-006's pendulum premise is adjudicated.
   *Verify:* a verdict line per item; the TASK-035 verdict cites a **per-frame
   trace or a conserved invariant**, never a single-frame snapshot
   (`reference_agent_browser_physics_feel_single_frame` — a soft system is
   mid-settle one frame after any action).

2. **The bespoke 404 serves in production.**
   *Verify, both halves:*
   ```sh
   ls web/dist/404.html || ls web/dist/404/index.html   # SSG emits it at all
   curl -s -o /dev/null -w '%{http_code}' https://www.chaipalaka.com/nope-$RANDOM   # 404
   curl -s https://www.chaipalaka.com/nope-$RANDOM | grep -q 'data-server-rendered' # ours, not Caddy's
   ```
   Requires a `handle_errors` block in `deploy/Caddyfile` **and** the splat route
   added to the prerender set. `deploy/` changes are **propose-then-apply**.

3. **Dev-route disposition is decided and executed** for `/test/canvas`,
   `/test/plain`, `/test/box`, `/test/box-b`, `/sandbox/cards`,
   `/sandbox/scenes/:id`, `/lab`.
   *Verify:* a written ruling in the task notes, and
   ```sh
   ls web/dist/test web/dist/sandbox   # absent for every route ruled "hide"
   ```

4. **The sitemap lists every public route.**
   *Verify:*
   ```sh
   grep -c '<loc>' web/dist/sitemap.xml            # ≥ the public route count
   grep -q '/lifelog' web/dist/sitemap.xml && grep -q '/stuff' web/dist/sitemap.xml
   grep -c '/test/\|/sandbox/' web/dist/sitemap.xml   # 0
   ```
   Plus a canonical-host ruling (apex vs `www`) applied consistently in
   `deploy/Caddyfile` and `vite.config.ts`'s feed `baseUrl`.

5. **`make deploy-web` + `make assets-sync` have run end-to-end against the real
   box**, and the flash question from finding 2 is settled by observation.
   *Verify:*
   ```sh
   curl -s -o /dev/null -w '%{http_code}' \
     https://www.chaipalaka.com/assets/ruffle/nightly-2026-05-12/ruffle.js   # 200
   ```
   **Human-gated** — every server touch needs Chai's explicit go per CLAUDE.md.

**Re-plan checkpoint (2026-08-02):** if the sweep escalates TASK-035 from NICE to
MUST, fire **CUT-1 immediately** and surface it — never absorb it silently. Chai's
answers to **O1** and **O2** are due here.

---

## M1 — Routes filled · exit **2026-08-16** · 30 h

A4 is the launch bar: *every route filled with content, designed, working*. M1
delivers the structural half on desktop; M2 does mobile and the bulk content.

**Contents:** TASK-033 `/lifelog` → composed canvas (incl. ADR-0012 and the
spawn-kick class fix) · TASK-034 `/about` build · per-route composed layout design
for `/stuff`, `/stuff/flash`, 404 · content authoring wave 1 (bio prose).

### Exit criteria — all four must hold

1. **ADR-0012 is ratified before any lifelog build hour.** A box-less `/lifelog`
   departs from **ADR-0005 decision 1** ("each route is a fixed, solid, scrollable
   content box"), and **ADR-0011** states that moving that carve-out beyond `/lab`
   "becomes its own decision". The ADR is a **gate, not a deliverable** — drafted,
   reviewed by Chai, signed off (DoD #6) *before* the route is rewritten.
   *Verify:* `docs/adr/0012-*.md` exists on the branch and the sign-off is recorded
   before the first `Lifelog.tsx` commit.

2. **No public route renders v1-era styling or a v1 scatter card-chain.**
   *Verify:* `grep -rn "pageSpecFromLayout" web/src/routes/` returns only routes
   whose composition is deliberate; visit `/`, `/blog`, `/blog/:slug`, `/lifelog`,
   `/stuff`, `/stuff/flash`, `/about` and a 404 URL.

3. **`/about` exists, prerenders, and carries real authored bio prose with working
   Portal links.**
   *Verify:* `grep -q 'data-server-rendered' web/dist/about/index.html` and the bio
   text is present in that file; peek fires on a Portal link in it.

4. **`/lifelog`'s authored arrangement is stable across a 5-minute idle session.**
   *Verify:* card centres move **< 2 px** between t=0 and t=5 min, measured from
   `snapshotCardRects` or two agent-browser screenshots at an explicit
   `set viewport 1280 860` (the default ~1280×577 clips fixed chrome). This is the
   direct test of the K1 composition-vs-drift collision, **and it fails if the
   spawn-kick gap is unfixed.**

**Re-plan checkpoint (2026-08-16):** first point with two weeks of measured pace.
Re-estimate M2–M4 against actual burn. If measured pace is below 12 h/week, fire
CUT-1 and CUT-2 together.

---

## M2 — Mobile + content · exit **2026-08-30** · 30 h

The largest unticketed piece (mobile) and the writing run here. Neither compresses
late: mobile is a build, and prose does not get better under deadline pressure.

**Contents:** responsive layout foundation · mobile pinned-card rail · blog draft
decision + route intro prose.

**Loaded at 38.75 h against 30 — the most over-subscribed window in the plan.**
CUT-7 (rail → existing box-edge park regime) is its resident cut and is **more
likely than not to fire**. That is stated here, at planning time, rather than
discovered on 2026-08-30.

### Exit criteria — all four must hold

1. **Every public route is usable at 390×844** — no horizontal scroll, no clipped
   chrome, prose legible without zoom, frame bar thumb-reachable (PRD story 44,
   which has no implementation today).
   *Verify:* an agent-browser pass **in the main session** (never a subagent — a
   subagent's screenshot never reaches the orchestrator, so a visually-AC'd task
   would pass unverified), `set viewport 390 844`, one screenshot per route; plus
   one pass on a real phone against the deployed build. Check `innerHeight` before
   calling anything a render bug.

2. **The mobile pin model matches whatever CUT-7 left standing**, and the spec
   records which. Uncut: pinned cards live on a bottom edge rail (spec §4) —
   *verify* `grep -rn "rail" web/src/pin/` returns implementation (today `rail`
   appears **nowhere** in `web/src`; the task-022 mobile bottom *overlay* is its
   only precedent). Cut: mobile pins reuse the shipped box-edge park regime, and
   the divergence is written into the spec **in the same branch**.

   > **CUT-7's fallback is not free — TASK-043 sweep, 2026-07-28.** "Reuse the
   > shipped box-edge park regime" assumes that regime works at mobile heights. It
   > does not. Measured: a parked-bottom card's bottom edge sits at
   > `(vh + 480)/2 + parkRest + h/2`, so it is **clipped off-screen whenever
   > viewport height < 816** (vh 800 → clipped 8px; vh 700 → clipped 58px). A
   > 390×844 device is only nominally above that line — real `innerHeight` after
   > browser chrome typically lands in the 750–800 band, i.e. **below** it. So
   > firing CUT-7 does not avoid the work, it converts it into a park-geometry fix
   > (pinned as TASK-035 AC#8). Weigh CUT-7 with that cost attached, and re-measure
   > at real `innerHeight` — not the nominal device height — before ruling.

3. **`armPressMs` is reconciled.** `pinTuning.armPressMs = 200` vs PRD story 42's
   ~350 ms mobile long-press. One is wrong. *Verify:* the value matches the PRD, or
   the PRD is amended with the reason. Gesture tests drive **synthetic
   PointerEvents in one async eval** — CDP `mouse move` does not fire `pointerover`,
   and a 0-dt drag inflates fling by ~16×.

4. **The blog content decision is executed.** *Verify:*
   `grep -rln 'draft: true' content/blog/` matches only posts on a written
   post-launch list.

**Re-plan checkpoint (2026-08-30):** the last checkpoint before the capstone.
**Scope freeze takes effect here** — after this date no new scope enters prod-v1
except bug fixes on scheduled scope; new ideas become drafts. M3's budget is
protected; anything unfinished competes with M4, never with M3.

---

## M3 — Design capstone · exit **2026-09-13** · 30 h

**This milestone is protected and nothing shares it.** A23 names TASK-030 plus
general UX/look-and-feel polish as the one thing Chai would rather slip the date
than launch without; A18 fixes the date. Reserving the window and cutting around it
is the only way both hold. No register entry touches M3 before CUT-9, and CUT-9 is
an **escalation to Chai**, not a unilateral cut.

**Contents:** TASK-030 in full — card chrome, preview/Portal/Pocket styling, box
type/colour/spacing, the spec §15 motion vocabulary, both themes, **plus** mobile
viewports, the static-fallback look for the ~18% without WebGPU (ADR-0009), and
background-scene curation.

### Exit criteria — all four must hold

1. **One coherent design system across the whole spine.** *Verify:* TASK-030 AC#1
   checked; a before/after of every route; no route still shows v1 card chrome.
2. **Styling and tokens only — no behaviour regressions.** *Verify:* TASK-030 AC#2;
   full verify gate green; `git diff --stat main...HEAD` concentrated in `.css` and
   token files, with any `.tsx` change justified in the handoff.
3. **Contrast floor holds in BOTH themes** — v2 spec §6's ≥4.5:1 for prose in the
   box, evaluated per theme, not once. *Verify:* measured contrast, light and dark.
   Verify any value-driven CSS variable at its **range extremes**, not at its live
   value — a modulated style can invert only at the boundary.
4. **The static fallback is designed, not residual.** *Verify:* the no-WebGPU
   PNG/gradient path screenshotted and signed off alongside the live canvas.

**Re-plan checkpoint (2026-09-13):** 13 days to launch. Everything still open goes
to the register; nothing new starts that is not on the launch path.

---

## M4 — Launch · exit **2026-09-26** · 28 h

Deliberately a sketch. Its content is whatever survived the register — reserve the
shape, fill it at the M3 checkpoint.

**Fixed contents (never cut):**

- **Deploy rehearsal, ~2026-09-19** — a full human-gated `make deploy-web` +
  `make assets-sync` a week before launch day, to a state Chai accepts being
  briefly public. Proves rsync, TLS, `/api/*` and the asset path *before* it
  matters.
- **Rollback artifact** — the previous `/var/www/chaipalaka` copied aside on the
  box before any overwrite. The coming-soon page is a genuinely usable floor.
- **Launch checklist execution** — RSS validity, sitemap vs the real public route
  set, OG tags per route, no-JS floor on every content-box route, reduced-motion
  pass, `/api/*` liveness, secret-scan, prerender check.
- **Production deploy + post-deploy verification on the live host** — every route,
  mobile and desktop, 404, API.
- **Housekeeping** — TASK-031 (branches), TASK-032 (GitHub issues). Zero-risk local
  work, parked here deliberately: it has no dependents and must not compete with
  anything load-bearing (brief §4's fair jab about deleting branches while a pin bug
  goes unverified is answered by *sequencing*, not by overriding Chai's triage).
- **A hard freeze from 2026-09-24** — verification and fixes only.

**Contingent contents, in survival order:** flash catalogue depth · `/claude`
route · TASK-039 fat tethers · anything M2/M3 pushed. *(CUT-1 and CUT-2 are
budgeted to fire here — see the reconciliation table.)*

### Exit criterion

**`https://www.chaipalaka.com` serves prod-v1, not the coming-soon page**, with
every public route rendering authored content on mobile and desktop, and the launch
checklist fully checked. *Verify:* the checklist document, signed off per DoD #6.

---

## Board wave — what exists on the board

Created / re-pointed on 2026-07-26 under milestone **`prod-v1`**, after the eval
worktrees and `eval/arm-*` branches were torn down — they held tasks 043–056, and
backlog assigns IDs by a max+1 scan, so creating before the teardown risked a
silent skip. Max ID on `main` was 042; the wave took 043–046 as expected.

| Board item | Piece | M | Blocked by |
|---|---|---|---|
| **TASK-043** — board staleness verification sweep *(new)* | WP-01 | M0 | — |
| **TASK-044** — launch hygiene: 404, dev routes, sitemap, canonical host, deploy dry-run *(new)* | WP-02 | M0 | — |
| TASK-033 — lifelog → **composed canvas** *(rewritten: title, description, all ACs)* | WP-03 | M1 | 026, **043** |
| TASK-034 — `/about` *(re-pointed + 2 ACs)* | WP-04 | M1 | 026, **046** |
| **TASK-045** — per-route composed layout design *(new)* | WP-05 | M1 | 033, 034 |
| **TASK-046** — launch content authoring wave 1 *(new)* | WP-06 | M1–M2 | — |
| TASK-030 — design capstone *(re-pointed, protect-last, 028 edge removed)* | WP-11 | M3 | 020–027, 029, 033, 034, 045 |
| TASK-031 · TASK-032 — housekeeping *(re-pointed)* | WP-12 | M4 | — |
| TASK-039 — fat tethers *(re-pointed + CUT-1 marker AC)* | WP-13 | M4 | — |

Graph machine-checked after the wave: **50 tasks, no cycles, no dangling refs**
(full DFS over every `dependencies:` edge, including pre-existing ones).

**Two edges are deliberately missing and must be added at the M2 checkpoint:**
TASK-030 also depends on the responsive-layout foundation (WP-07) and the mobile
pin rail (WP-08) per the spine-first rule, but those tasks do not exist yet under
rolling-wave discipline. `--dep` **replaces** the whole list — pass the complete
set when adding them, never a single id.

**Not yet created, by design:** responsive foundation (WP-07), mobile rail (WP-08),
flash ingest (WP-09), `/claude` (WP-10), the launch task (WP-14). Rolling-wave
discipline — created at the checkpoint that opens their milestone, from a fresh
board view on `main`.

**Deferred, annotated in place:** TASK-028, TASK-035, TASK-040, TASK-041.
**Drafts (9):** no CLI edit verb exists, so their disposition lives only in
[`board-accounting.md`](board-accounting.md).
