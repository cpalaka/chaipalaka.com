# prod-v1 — accounting ledger

**Every one of the 19 board items (10 open tasks + 9 drafts) and every unticketed
scope item in brief §5 is accounted for below: scheduled, explicitly deferred, or
explicitly killed. Silence on an item would be a defect.**

Dispositions:

- **SCHEDULED** — has a milestone and a work piece in this plan.
- **SCHEDULED-CUTTABLE** — scheduled, and named in the ordered cut register.
- **DEFERRED** — explicitly out of prod-v1, stays on the board, post-launch.
- **KILLED** — closed as no-longer-valid, with the reason.

---

## Open tasks (10)

### TASK-028 — v2.1 persisted per-route pins · **DEFERRED**

Cut by name in A21 — the only *net-new* cut in that answer (sound and pretext had
already dropped to NICE via A19). Stays To Do under milestone `v2`. Its own
description already frames it as a v2.1 fast-follow, so this matches the ticket's
intent.

**Board defect fixed here (both input roadmaps missed it):** `TASK-030` — the
protect-last capstone — carried `TASK-028` in its `dependencies` list, so the
launch-critical capstone read as **blocked by a task deferred post-launch**. The
edge has been removed by passing the complete remaining set (`--dep` **replaces**
the whole list, which is presumably why both inputs left it alone). TASK-030's
dependencies are now TASK-020–027 + TASK-029, all Done.

**Note carried forward:** task-035 AC#4 concerns parked-card restore *via*
task-028. With 028 deferred, that AC is dormant, not orphaned.

---

### TASK-030 — v2 full design pass (capstone) · **SCHEDULED · M3 · PROTECTED**

WP-11, 22–30 h, the whole of M3. **The protect-last item** (A23: "the design
capstone plus general ux design look and feel polish").

Reserved and cut *around* — no register entry touches it before CUT-9, which
escalates to Chai rather than cutting. Its scope is read as including A23's general
UX/look-and-feel polish, plus mobile viewports, the static-fallback look
(ADR-0009) and background-scene curation — broader than the ticket's two current
ACs. Runs **after** the structural work per the ratified spine-first rule; mobile
responsiveness counts as spine, not design.

---

### TASK-031 — clean up stale local git branches · **SCHEDULED · M4**

WP-12, ~1.5 h. Picked MUST in Q14. Parked in M4 so it competes with nothing (see
[`open-questions.md`](open-questions.md) §T14). Local branches only; each deletion
confirmed obsolete post-history-rewrite, not blind; remote deletions need explicit
confirmation.

---

### TASK-032 — triage and close stale GitHub issues · **SCHEDULED · M4**

WP-12, ~2.5 h. Picked MUST in Q14. Recorded gotcha applies: `gh` HTTPS writes fail
TLS in the sandbox (`OSStatus -26276`) — run each with the sandbox disabled — and
every `gh` write is human-gated.

---

### TASK-033 — lifelog rollout · **SCHEDULED · M1 · REWRITTEN**

WP-03, 12–19 h. MUST (pre-marked from A9). **The ticket's own description is wrong
and gets rewritten**: it specifies a quiet content-box; A9 rules it a composed
canvas route. See [`open-questions.md`](open-questions.md) §T1.

Pinned constraints, as ACs:

- **ADR-0012 is a gate**, ratified by Chai before any build hour — a box-less route
  departs from ADR-0005 dec. 1 and ADR-0011 says that carve-out "becomes its own
  decision".
- The composed arrangement survives a 5-minute idle session (< 2 px drift) — the
  K1 test.
- Mechanism = **STRUNG cards on short ropes** (Chai's O1 ruling, 2026-07-26) — a
  living composition, bounded drift, `driftScale` low but **> 0**. The
  derived-rope-length problem is an explicit AC: a card authored mid-viewport needs
  its own static anchor, so the anchor topology is authored and recorded.
- The `CardImpl.tsx:90` **spawn-kick ordering gap is fixed as a class**, not an
  instance — under STRUNG it makes arrival visibly jumpier than authored rather
  than destroying the composition, on the route whose point is an authored
  arrangement.
- `driftScale` is authored **route-side, never in an Atelier-regenerated
  `.layout.ts`** (drift spec D7) — whole-file regen silently drops it.
- Spec §8's route table and `CONTEXT.md`'s lifelog language are amended in the
  same branch.

---

### TASK-034 — `/about` page · **SCHEDULED · M1**

WP-04, 4–6 h build (bio copy is WP-06). Picked MUST in Q14. Greenfield route on a
shipped pattern. Depth is elastic — **CUT-6** reduces the bio to one paragraph
without removing the route.

---

### TASK-035 — word-anchored pin scroll stability · **SCHEDULED (verification only) · M0**

Not picked in Q16, so it is **NICE for *fixing***. But A11 makes verification real
work, and Chai's belief that it is stale is `[leaning]`, not `[decided]` — nobody
has checked.

**Its four symptoms are individually re-tested inside WP-01**, against current
`main`, under drift, using a per-frame trace or a conserved invariant rather than a
single-frame snapshot. The symptoms were observed on `/test/box` during task-028
dev review, *before* 042.01–.04 landed, so drift may have fixed all, some, or none.

The brief also carries an unverified interviewer reading — that
`PinnedCard.parkAt`'s reduced-motion branch parks a top card at
`edgeAnchor.y + parkRest`, *inside* the box over the prose, while the non-reduced
path lets prose repel settle it outside. **WP-01 confirms or refutes that rather
than inheriting it as fact.**

**If any symptom reproduces, TRIGGER-A fires CUT-1**, freeing ~18 h to fix it, and
the escalation goes to Chai at the 2026-08-02 checkpoint rather than being absorbed
silently.

---

### TASK-039 — fat-line tethers (TSL) · **SCHEDULED-CUTTABLE · M4 · CUT-1**

WP-13, 14–24 h. Picked MUST in Q15 — and **first in the cut order**. L-sized,
technique fork unresolved on the ticket, WebGPU-only (~18% of visitors see
nothing), zero dependents. The cheapest ~18 h in the plan.

**Because this reverses a stated preference, firing CUT-1 must be surfaced to Chai
at the checkpoint that fires it, not applied quietly.**

---

### TASK-040 — z-layered parallax depth field · **DEFERRED**

Not picked in Q15. Its AC#1 (what the z-layers depict) is still an open design
question on the ticket. Stays To Do under `v2`.

---

### TASK-041 — field-warp around cards · **DEFERRED**

Not picked in Q15. Its AC#1 (combine with task-038's auras or pick one) is
undecided, and ADR-0011 deliberately declines to decide it. Stays To Do under `v2`.

---

## Drafts (9)

> **Drafts cannot be annotated on the board.** `backlog draft` exposes only
> `list` / `create` / `archive` / `promote` / `view` — there is no edit verb, so a
> disposition note cannot be written onto a draft file (and hand-editing under
> `backlog/` is forbidden; the CLI owns those files). **This section is therefore
> the only record of each draft's prod-v1 disposition.** Do not read the absence of
> a note on a draft as the draft having been overlooked.

All nine are **ungrilled**, and A19 ruled that ungrilled drafts drop to NICE ("a
MUST you haven't designed yet isn't really a MUST"). That catches **six** that had
been picked — DRAFT-001, 002, 003, 004, 005 and **007** (the brief correctly notes
007 is also ungrilled, making it six, not five). None is killed by that rule; each
stays a draft awaiting a grill session post-launch.

### DRAFT-001 — sound design + juice · **DEFERRED**
Picked in Q17, dropped to NICE by A19, **then cut by name in A21**. Doubly out.

### DRAFT-002 — card fragment shaders · **DEFERRED**
Picked in Q15, dropped by A19. Part of the "simplified form" reading (§T12): shipped
shader work stays, new shader work does not. TASK-030 does **not** absorb it — the
capstone is a no-shader reskin.

### DRAFT-003 — background-shader overhaul · **DEFERRED, with a named consequence**
Picked in Q15, dropped by A19. **Consequence, stated rather than discovered:**
launch ships the *existing placeholder* background scenes. WP-11 **curates** which
ones ship and their fallback PNGs; it does not author new ones. Flagged as the
second-highest-value NICE item if T3/O3 reopens — it upgrades a surface every
visitor sees on every route, unlike `/lab`-only or card-only effects.

### DRAFT-004 — asymmetric wide media (jut past box borders) · **DEFERRED**
Picked in Q17, dropped by A19. Also collides with v2 spec §13's explicit v2.0
assumption that content stays inside the box rectangle — so it needs both a grill
*and* a spec amendment. Correctly post-launch.

### DRAFT-005 — pretext use-cases · **DEFERRED**
Picked in Q17, dropped by A19, **cut by name in A21**. Doubly out.

### DRAFT-006 — rework parked-card feel · **DEFERRED, premise to be adjudicated**
Not picked in Q16. **The one confirmed-stale board item**: it complains that a
parked card "hangs and swings as a live physics pendulum off the box", but ADR-0010
set engine gravity to `{0,0}` on every route and no route declares gravity. There
is no pendulum.

WP-01 decides whether anything survives of the underlying concern (parked-card
*feel* under drift, a different question) or whether the draft is dead. **Do not
promote it without that verdict** — building from its current text would be
building against a world that no longer exists. **Not silently killed**: Chai
decides kill-vs-rewrite once the sweep reports.

### DRAFT-007 — hero-morph polish · **DEFERRED**
Picked in Q16, dropped by A19 (it is ungrilled — the brief catches this). **The
cheapest delight-per-hour item on the NICE list** (4–8 h, pure CSS in head-loaded
`base.css`, improving the most-seen transition on the site). If T3/O3 reopens and
one NICE item is restored, this is the one, and it folds into WP-11's
motion-vocabulary work rather than needing its own slot.

### DRAFT-008 — recursive previewability · **DEFERRED**
Not picked in Q16. Its own description enumerates five unresolved edge cases
(single-held-preview collision, no parent body to rope to, orphaning, bridge
timing, depth model). Genuinely not ready.

### DRAFT-009 — three.js inventory · **DEFERRED (a container, not a task)**
Not picked in Q17. It is the idea inventory that already produced tasks 038–041;
its remaining walk items (#2 lava toy, #12 VT guardrail) are unstarted. Stays the
parking lot it is; the walk resumes post-launch from its ledger marker.

---

## Unticketed MUST scope (7, from brief §5)

| Item | Source | Disposition | Piece | M |
|---|---|---|---|---|
| responsive/mobile layout + mobile pinned-card rail | A4 | **SCHEDULED** — layout is a **hard floor, never cut**; the rail is **CUT-7** | WP-07, WP-08 | M2 |
| per-route composed layout **design** | A6, A9 | **SCHEDULED** (TASK-045; `/stuff` portion is CUT-5, budgeted to fire) | WP-05 | M1 |
| content authoring, per route | A4, A6 | **SCHEDULED** (TASK-046; blog depth is CUT-4; scheduled earliest with a starvation detector) | WP-06 | M1–M2 |
| `/claude` route, ≈15 docs | A5, A13 | **SCHEDULED-CUTTABLE — CUT-2** | WP-10 | M4 |
| ~40 flash items ≈100 MB | A4, A7 | **SCHEDULED** (catalogue depth is CUT-3; format is **O4**) | WP-09 | M4 |
| board staleness verification | A11 | **SCHEDULED — first item in the plan** (TASK-043) | WP-01 | M0 |
| deploy + launch checks | §3 | **SCHEDULED, never cut** — TASK-044 (M0 dry-run) + an M4 rehearsal + go-live task created at its checkpoint | WP-02, WP-14 | M0 + M4 |

**On the mobile split.** The brief lists this as one item; the plan splits it into
WP-07 (responsive layout — a hard floor, because a site that does not lay out on a
phone fails A4 outright) and WP-08 (the rail — sophistication, which CUT-7 degrades
to the shipped box-edge park regime). Splitting it is what makes the mobile *bar*
protectable while still leaving something to cut.

---

## Scope this plan discovered that appears on neither list

Found by direct inspection of `main` @ `1d5bed6` on 2026-07-26. All launch-visible;
none was in the brief or on the board.

| Item | Finding | Disposition |
|---|---|---|
| **Prod 404 never fires, and no 404 page exists** | `deploy/Caddyfile` has a bare `file_server` with zero `handle_errors` blocks — *and* the prior `web/dist/` contains no `404.html` and no `404/` directory, so `vite-react-ssg` never prerenders the splat route. Both halves need fixing. `file_server` also lacks a `try_files` fallback, so client-only routes 404 in prod | **SCHEDULED · M0 · WP-02.** Propose-then-apply — `deploy/` changes affecting production are gated |
| **Sitemap omits most of the public site** | `vite-plugin-feeds.ts:118` hardcodes `staticRoutes = ['/', '/blog']`; the emitted sitemap carries 4 URLs. `/lifelog`, `/stuff`, `/stuff/flash`, `/lab` — and `/about`, `/claude` — are never listed | **SCHEDULED · M0 · WP-02** |
| **Apex and `www` both serve, no canonical redirect** | Caddy site block is `chaipalaka.com, www.chaipalaka.com` with no redirect; feed `baseUrl` is apex, `make deploy-web` echoes `www` | **SCHEDULED · M0 · WP-02** |
| **Dev routes are prerendered, not merely reachable** | `vite.config.ts:170–174`'s filter ships `/test/*`, `/test/box-b`, `/lab` and `/sandbox/scenes/*` as static directories in `dist/` | **SCHEDULED · M0 · WP-02.** Default disposition in [`open-questions.md`](open-questions.md) §T7 (**O5**) |
| **`driftScale: 0` spawn-kick ordering gap** | `CardImpl.tsx:90` computes `SPAWN_KICK * world.getDriftScale()` before `usePageDef` applies the route's value; the code's own comments say so; `PhysicsWorld.driftScale` defaults to `1` | **SCHEDULED · M1 · TASK-033 AC#5.** Under the ruled STRUNG mechanism ropes recapture the cards, so an unfixed kick makes arrival visibly jumpier than authored rather than destroying the composition — still in scope, on the route whose whole point is an authored arrangement. Under the rejected `driftScale: 0` path it would have destroyed the composition at mount |

### One inherited finding this plan REFUTED

| Claim as received | What inspection found |
|---|---|
| "No `assets/` directory in the repo, no `.swf` anywhere, the Ruffle runtime is itself an unsynced asset, `make assets-sync` has never carried a payload, **`/stuff/flash` is non-functional in production today**" | **False.** `assets/` exists on this machine — gitignored, exactly as the project's >1 MB rule requires — holding 33 MB: 4 `.swf` + 4 PNGs **and** `assets/ruffle/nightly-2026-05-12/`, the precise version `RuffleEmbed.tsx:3` requests. The claim was verified against the **git** tree, where `assets/` is invisible by design. **What is genuinely unknown is whether `assets-sync` has ever been run against the box** — settled by WP-02's live-host `curl`, not by reading the repo. The live-host acceptance criterion survives; the diagnosis does not |

---

## Explicitly deferred lifelog expansion (brief A8)

Recorded so A8's direction is not lost by T4's minimum-scope default:

last.fm top weekly artists · Letterboxd depth beyond recent films · Goodreads depth
· **Claude activity log** (existing local data source, minimal presentation) ·
sleep tracking · YouTube daily analysis.

All **DEFERRED** to post-launch. Each is an independent backend adapter plus a card
(~6–10 h each) and can ship the week after launch. The minimum that *does* ship is
ratified as a section of **ADR-0012**, not only here — so a future session reads it
where the decision lives. Forcing date for reversing this: **2026-08-02**,
alongside the other M0 checkpoint decisions. The shipping minimum is a section of ADR-0012.

---

## Nothing is KILLED

Consistent with brief §5: nothing was explicitly killed in the interview, and this
plan kills nothing either. The closest case is **DRAFT-006**, whose stated premise
is provably false — but the draft is held for a verdict from WP-01 rather than
closed, because the underlying concern (what parked cards should *feel* like under
drift) may survive its dead premise. Chai decides kill-vs-rewrite.
