# prod-v1 — tensions confronted, and what stays open

The brief §6 lists nine recorded tensions and forbids resolving any by omission.
This document confronts all nine, plus every other `[open]` / `[unanswered]` tag in
brief §4 that bears on the plan.

**Status vocabulary:**

- **RESOLVED** — settled here, on evidence, with the reasoning shown. No decision
  needed from Chai beyond the standing DoD #6 sign-off.
- **DEFAULTED** — the plan proceeds on a stated assumption because proceeding under
  *some* assumption beats blocking. The assumption is named, the cost of being
  wrong is named, and a **forcing date** is set. Chai can overturn it at that date
  at no penalty.
- **OPEN** — genuinely needs Chai. Named, with what it blocks and when.

| # | Tension | Source | Status |
|---|---|---|---|
| T1 | Lifelog specified two ways | §6.1 | RESOLVED — **but it obliges ADR-0012** |
| T2 | Composed layouts vs drift (the *mechanism*) | §6.2 | **RESOLVED — Chai ruled O1, 2026-07-26** |
| T3 | Delight goal vs triage | §6.3 | **OPEN — O3** |
| T4 | Lifelog minimum undefined | §6.4 | DEFAULTED |
| T5 | Board staleness unquantified | §6.5 | RESOLVED (as scheduled work) |
| T6 | Capacity | §6.6 | RESOLVED |
| T7 | Dev routes + `/lab` | §6.7 | **RESOLVED — Chai ruled O5, 2026-07-28** (default confirmed) |
| T8 | Who ratifies an ADR amendment | §6.8 | RESOLVED (by existing process) — **O6** to override |
| T9 | Content authoring effort | §6.9 | **OPEN — O2** |
| T10 | `/claude` index + build-pull vs copy | Q13 | DEFAULTED |
| T11 | Flash: `.swf` vs video; does the pipeline work | Q7 | **RESOLVED — Chai ruled O4, 2026-07-28** (all `.swf`) |
| T12 | "Simplified form" of the shader/three.js WIP | Q12 | DEFAULTED |
| T13 | Do `/stuff` and `/` follow lifelog's composed model | Q9 | DEFAULTED |
| T14 | TASK-035 skipped while all housekeeping was picked | §4 block 4 | RESOLVED (as scheduled work) |

---

## T1 — Lifelog is specified two ways · §6.1 · **RESOLVED**

**The tension.** A9 rules `/lifelog` a **composed canvas route**. Spec §8's route
table, task-033's description, and `CONTEXT.md` all say **quiet content-box**.

**Resolution: A9 wins; the documents are wrong and get updated.** A9 is the later,
explicit, `[decided]` ruling from the owner, made with the collision put to him
directly. A spec contradicting a ratified decision is a stale spec.

**What that obliges, in the same branch as the code** (project rule: a slice's
design change updates `PRD.md`/the spec in the same commit, unconditionally):

- v2 spec §8 route table — the `lifelog signals` row → composed canvas.
- `CONTEXT.md` — the lifelog references in the content-box entry.
- task-033's own description and ACs.

**Residual — and it is the part both input roadmaps missed.** A composed canvas
`/lifelog` is a **box-less** route, and **ADR-0005 decision 1** says *"Each route
is a fixed, solid, scrollable content box."* **ADR-0011** created the only existing
exception (`/lab`, Chai-approved personally) and states outright that extending
that carve-out *"becomes its own decision."*

So a second box-less route is not a detail of drift tuning — it is the case
ADR-0011's precedent anticipates.

> **ADR-0012 is required, and it is a GATE, not a deliverable.** Drafted, reviewed
> by Chai, signed off (DoD #6) **before any lifelog build hour.** It records: the
> box-less carve-out and its departure from ADR-0005 dec. 1; the drift mechanism
> (T2 — **ruled STRUNG short ropes**, 2026-07-26); the shipping minimum (T4); and
> the three documents amended in the same branch.

The ADR was required **whichever** mechanism O1 picked — the mechanism is one
section of it, not its reason for existing. If **CUT-8** ever fires, `/lifelog`
reverts to a content box and ADR-0012 becomes unnecessary.

---

## T2 — Composed layouts vs drift · §6.2 · **RESOLVED — Chai ruled 2026-07-26**

> **RULING (O1, Chai, 2026-07-26): option (b) — STRUNG cards on short ropes. A
> living composition, not a still one.** `/lifelog` cards are tethered to authored
> static anchors so their wander is bounded; route `driftScale` is authored low but
> **greater than zero**, so the cards stay alive. Recorded on task-033 as AC#3 and
> ratified in ADR-0012's mechanism section. The cost this ruling accepts is
> spelled out under (b) below — the derived-rope-length problem — and task-033 AC#4
> makes addressing it explicit rather than implicit.

**The tension.** ADR-0010 decision 2 states "no home anchors, no spring-back", and
its trade-offs explicitly accept that *"composition dissolves slowly on canvas
routes (free components wander)"*. An authored composition is precisely what drift
is designed to dissolve.

**Two mechanisms existed. Both were verified sound; neither dominated, so the
choice was Chai's taste call, not a planner's.** Both are recorded below because
the rejected option is the fallback if the rope topology proves unworkable in
build, and because CUT-8 reverses the whole thing.

### Option (a) — `driftScale: 0`: a still composition · **NOT CHOSEN**

Verified in source this session:

- `PageSpec.driftScale?: number` already exists — `web/src/physics/PageSpec.ts:61`.
- `usePageDef` pushes it into the world — `usePageDef.ts:28`.
- At `driftScale: 0` the run-and-tumble impulse speed is zero, so a card receives
  no wander at all — `PhysicsWorld.ts:800`
  (`const speed = driftTuning.impulseSpeed * this.driftScale`).
- Prose repel is **binary-gated** on `driftScale > 0`, so it is off too —
  `PhysicsWorld.ts:853`. On a box-less route there is no `contentBoxRect` anyway.

So an authored composition **does not dissolve, because nothing moves it.** This is
not a workaround: ADR-0010's own trade-offs anticipate per-route tuning ("Reading
routes must tune drift to near-still (`driftScale`)"), and the reduced-motion path
(D8) already uses `driftScale: 0` site-wide. The route sits at one end of an
existing, ratified dial. It upholds decision 2 rather than eroding it — still no
home anchor, no spring-back; drag a card and it stays where dropped.

**Cost:** `/lifelog` has no ambient life. It is a still composition you can push
around.

### Option (b) — STRUNG cards on short ropes: a living composition · **CHOSEN**

Also grounded, in the ratified documents:

- `CardSpec` still carries `parent: ParentRef` and an authored `anchor` — the v1
  authored-topology machinery exists.
- `CONTEXT.md` **Strung**: *"Under Drift: drifts bounded, held within rope reach of
  its static anchor."*
- ADR-0010 decision 3 backs it: "STRUNG / DETACHED keep their names; consequences
  become **bounded drift** vs free wander."

**Cost, and it was an unclosed loop in the source proposal — now an explicit
deliverable:** a **Tether**'s length is *derived* from
`distance(parentAnchorPos, cardLayoutPos)` (CONTEXT.md). So "short ropes" means
"cards authored near a static anchor". A card deliberately placed mid-viewport —
which is exactly the "different sized cards arranged creatively across the page"
the route is being built for (A6) — **has no short rope available** unless a static
anchor is authored for it. That is extra authored topology, or a longer rope and a
looser composition.

**This is what the ruling buys and what it costs.** `/lifelog` gets ambient life,
and the price is an authored anchor topology that has to be designed rather than
derived. **task-033 AC#4 makes it explicit**: the anchor topology is authored and
recorded in the layout, and ADR-0012 notes it. It is the single most likely place
for WP-03 to run long (risk **R7**), and it is why the piece sizes at 15 h rather
than the ~12 h that `driftScale: 0` would have cost.

**If the topology proves unworkable in build**, option (a) is the in-place
fallback — one field, no new authoring — and reverting to it is a mechanism change
inside ADR-0012, not a re-plan. **CUT-8** reverses the whole route to a quiet
content box if the schedule demands it.

### What the plan does regardless of mechanism

- **ADR-0012 is required either way** (T1). The mechanism is one section of it, not
  its reason for existing.
- **The spawn-kick fix is required under (a) and advisable under (b) — and it stays
  in scope under the chosen (b).** Ropes recapture the cards, so an unfixed kick
  does not destroy the composition; it makes arrival visibly jumpier than authored,
  on the route whose whole point is an authored arrangement.
  `CardImpl.tsx:90` computes `prefersReducedMotion() ? 0 : SPAWN_KICK *
  world.getDriftScale()`, and the code's own comments (`:13–18`, `:87–89`) state
  that `usePageDef` has not zeroed `driftScale` at spawn time (`CardLayer` precedes
  `Outlet`). `PhysicsWorld.driftScale` defaults to `1` (`:102`). Under (a) every
  card therefore gets a full `SPAWN_KICK` of 4 and lands **off** the composition.
  Under (b) ropes recapture them, so it only makes arrival jumpier than authored.
  task-042.04 fixed the reduced-motion *instance*; **fix the class — order the
  `driftScale` set ahead of card registration**, rather than bolting a second
  synchronous read onto the spawn site.
- **`driftScale` is authored route-side, never in an Atelier-regenerated
  `.layout.ts`** (drift spec D7) — whole-file regen silently drops it and the
  failure is invisible. `Lab.layout.ts:6` carries exactly this warning.
- **The acceptance test is the same for both:** card centres move **< 2 px** across
  a 5-minute idle session. Under (b) that is a *stronger* claim than under (a) —
  bounded drift must be bounded tightly enough to hold the composition, not merely
  prevented. Verify per-frame or from `snapshotCardRects`, never a single-frame
  snapshot.

**Status:** ruled. Recorded on task-033 (ACs #1, #3, #4, #5, #6) and carried into
ADR-0012. **Residual risk R7** — an authored anchor topology is a new archetype
with unbounded polish appetite; ADR-0012 ratifies mechanism *and* shipping minimum
before any build hour, and arrangement *polish* belongs to WP-11, not WP-03.

---

## T3 — Delight goal vs triage · §6.3 · **OPEN — needs Chai (O3)**

**The tension, stated plainly.** A5 makes "visitors admire the site itself" an
explicit launch goal. A19 then moved **every** delight-bearing item to NICE —
sound (D-001), card shaders (D-002), background shaders (D-003), wide media
(D-004), pretext (D-005), morph polish (D-007). A21 cut two outright. TASK-030 is
the only delight-bearing MUST left standing, and **CUT-1 removes TASK-039**, the
last visual-fidelity item beside it — so in the budgeted path, launch delight rests
on the capstone alone.

**Why the plan cannot resolve this.** It is not a scheduling problem. A19 was a
*rule* Chai applied ("a MUST you haven't designed yet isn't really a MUST"), and
applying it consistently produced an outcome that may not match the intent behind
A5. Only Chai can say whether that outcome is acceptable or whether the rule
over-fired.

**What the plan does meanwhile.** Protects TASK-030 absolutely (M3 reserved,
nothing touches it before CUT-9) and reads A23's "general UX/look-and-feel polish"
into its scope rather than treating it as separate NICE work — plus the
static-fallback look and scene curation, so the ~18% without WebGPU are designed
for rather than left residual. That is the maximum delight the triage as recorded
permits.

**If Chai reopens it, the cheapest delight-per-hour item is DRAFT-007
(hero-morph polish)** — 4–8 h, pure CSS in head-loaded `base.css`, improving the
single most-seen transition on the site. It folds into the capstone's motion-
vocabulary work rather than needing its own slot. Second cheapest is **DRAFT-003
(background-shader overhaul)**, because it upgrades a surface every visitor sees on
every route, unlike `/lab`-only or card-only effects.

**Blocks:** nothing before 2026-08-30. **Decide by: 2026-08-30** (M2 checkpoint),
so a restored item can ride M3.

---

## T4 — Lifelog minimum undefined · §6.4 · **DEFAULTED**

**The tension.** A4 says "we can just do a very basic lifelog"; A8 describes
expanding last.fm (top weekly artists, not just recent tracks), Letterboxd and
Goodreads, plus three new trackers (Claude activity log, sleep, YouTube daily
analysis). No minimum was ever set.

**Default: the four adapters that exist today** (`/api/{books,now-playing,films,
github}`), re-presented as a composed canvas. **Zero new adapters, zero new
trackers, no deepening of existing ones.**

**Why.** A4 and A8 are not actually in conflict about the *launch* — A4 speaks to
launch scope, A8 to direction, and A8's own framing ("I'll come up with other
things") is roadmap language. Each new tracker is a backend adapter, a cache
policy, a fixture-based test and a card: 6–10 h each. Three is a milestone, not a
detail.

**Cost if wrong:** `/lifelog` launches thinner than pictured. Recoverable
incrementally — each tracker is independent and can ship the week after launch.

**Ratified where it will be read:** as a section of **ADR-0012**, not only here.

**Forcing date: 2026-08-02**, alongside O1 — the two are one conversation.

**Deferred, not dropped:** last.fm top weekly artists · Letterboxd depth ·
Goodreads depth · Claude activity log · sleep tracking · YouTube daily analysis.
See [`board-accounting.md`](board-accounting.md).

---

## T5 — Board staleness, unquantified · §6.5 · **RESOLVED as scheduled work**

**The tension.** A11 asserts staleness is systemic and that verification is real
work. Exactly one instance is confirmed (DRAFT-006's pendulum premise, dead since
ADR-0010 set engine gravity to `{0,0}`). The true rate is unknown.

**Resolution.** It becomes WP-01 — a timeboxed 4–7 h sweep, **the first item in the
plan**, giving every one of the 19 items a dated verdict. Not background
uncertainty to be absorbed: a scheduled deliverable whose **output is a trigger**
(TRIGGER-A) that can reorder the plan around it.

**This session already produced a live instance of the same failure mode**, and it
is the reason the sweep is sized generously: a finding handed to this plan as
"verified" — that the flash pipeline is broken and `/stuff/flash` is dead in
production — **is false**. It was checked against the git tree, where `assets/` is
gitignored *by design*. See [`README.md`](README.md) finding 2. Staleness is not
only a board problem; it is an inherited-premise problem.

**Residual:** the sweep can only verify what it can observe. Ungrilled drafts have
no implementation to test; "premise unchecked" is their verdict and is itself
useful.

---

## T6 — Capacity · §6.6 · **RESOLVED**

**The tension.** ≈133 h available. The surviving MUST list plus unticketed scope
was never re-estimated after A19/A21, and no cut list exists beyond A21.

**Resolution — both halves are now done:**

- **Re-estimated** independently, piece by piece, in
  [`work-pieces.md`](work-pieces.md): **≈155 h of scope + ≈20 h of process overhead
  = ≈175 h against 133 h.** Roughly **1.32× over** — better than the brief's
  pre-triage 1.6–3× because A19/A21 removed six drafts plus task-028, and because
  the lifelog mechanism costs a field rather than an engine feature.
- **Reconciled per milestone**, not only in total —
  [`milestone-map.md`](milestone-map.md). Every window holds its own piece sizes
  and names the cut that closes it. A plan whose total closes while M2 holds 42 h
  in a 30 h window has scheduled nothing.
- **Cut list built, ordered, triggered, and assigned to milestones** —
  [`risk-cut-register.md`](risk-cut-register.md). 46 h of budgeted cuts against a
  42 h gap, with ≈24 h held in reserve.

**Process overhead is not padding.** The DoD is six items ending in sign-off, plus
a per-branch adversarial review, plus local diff review — ≈1.25 h/task across ≈16
tasks. The brief's table budgets zero for it.

**The one number not generated independently is capacity itself** — brief §1 pins
133 h and forbids substitution. Recorded as risk **R6**: the stated range was
10–20 h/week, and at 10 h/week capacity is 89 h, which is 2× over rather than 1.3×.
TRIGGER-B watches *measured* pace from the first checkpoint.

---

## T7 — Dev routes and `/lab` · §6.7 · **RESOLVED — Chai ruled O5, 2026-07-28**

> **Ruling (2026-07-28).** The default table below is confirmed unchanged and
> executed in task-044: `/test/*` and `/sandbox/*` are dropped from the
> prerender set and stay reachable under `npm run dev`; `/lab` stays public and
> is now listed in the sitemap. Ratified by
> [ADR-0013](../adr/0013-canonical-host-and-hard-404.md), which also records the
> consequence the default did not anticipate — with no SPA fallback, a stripped
> route returns a real 404 in production rather than silently working.

**The tension.** `/test/canvas`, `/test/plain`, `/test/box`, `/test/box-b`,
`/sandbox/cards`, `/sandbox/scenes/:id` are publicly reachable; `/lab` (ADR-0011)
is a live public route. Q4 asked; **the question was never answered.**

**Verified detail, confirmed on `main` this session:** they are not merely
reachable — `web/vite.config.ts:170–174` filters only
`!p.startsWith('/sandbox/') || p.startsWith('/sandbox/scenes/')`, so `/test/*`,
`/test/box-b`, `/lab` and `/sandbox/scenes/*` **prerender into `dist/` as real
static directories** (confirmed against a prior build). `/sandbox/cards` is
filtered *out* of prerender but keeps its client route — and since `file_server`
has no `try_files` fallback, it already returns Caddy's 404 in production, so it is
effectively dev-only today by accident rather than by design.

**Default:**

| Route | Default | Why |
|---|---|---|
| `/test/canvas`, `/test/plain`, `/test/box`, `/test/box-b` | **Drop from the prerender set**; keep reachable in `npm run dev` | Development walkthroughs with scaffold copy. `/test/box` + `/test/box-b` remain the ratified ladder + nested-card demo surface (drift spec D1, ADR-0010) — kept in the codebase, just not shipped |
| `/sandbox/cards`, `/sandbox/scenes/:id` | **Drop from the prerender set** | The **Tuner** is explicitly "a development tool, not a production surface" (`CONTEXT.md`) |
| **`/lab`** | **Keep public** | A deliberate, ADR-ratified art surface (ADR-0011), the only place the metaball auras are visible, and exactly the "admire the site itself" material A5 asks for. Hiding it deletes shipped delight for no gain |

**Why default rather than block.** A4's "all the routes that exist currently need
to be filled in with content" plainly addresses *content* routes; reading it as a
commitment to author content for `/test/box` would be a misreading. And the
disposition is a filter in one config file — fully reversible.

**Cost if wrong:** near zero. **Forcing date: 2026-08-02** (M0 exit criterion 3).

---

## T8 — Who ratifies an ADR amendment · §6.8 · **RESOLVED by existing process — O6 to override**

**The tension.** A20b said "yes to all" across three materially different rules —
propose an amendment / author it / work around it. (a) and (b) differ on *who
ratifies*, and that was never settled.

**Resolution: the project already answers this, and the answer did not change.**
Definition of Done item #6 is *explicit user sign-off*, and it applies to every
task including doc-only ones. So:

- The plan (and any executing session) **may author** an ADR — that is A20b's (b),
  and it is just writing.
- **Chai ratifies it** by signing off the branch that carries it — DoD #6, which
  A20b explicitly did not override (the brief says as much).

There is no practical gap between (a) and (b): authoring is the work, sign-off is
the gate, and the gate was already there. What A20b actually granted is that the
plan need not *ask permission before drafting* — it can bring a finished amendment
to the sign-off gate rather than a request.

**This plan exercises it once:** ADR-0012 (T1). It is drafted by the executing
session and **gated on Chai's ratification before any build hour** — which is
stricter than DoD #6 alone, because the build depends on the decision.

**O6** exists only if Chai wants the other rule (plan decides, no ratification
step). Say so and this line updates.

---

## T9 — Content authoring effort · §6.9 · **OPEN — needs Chai (O2)**

**The tension.** Q6 asked, per route, whether content is *written* or *needs
writing*. That half was never answered, for any route. So whether the 133 h must
absorb Chai's own prose-writing time is unknown.

**Verified content state, and it is thinner than anything in the brief suggests:**

- `content/blog/` — 5 posts, **4 of them `draft: true`**. Production `/blog` lists
  **one** ("Hello, World").
- `content/stuff/flash/` — **4** entries against a stated ~40.
- `/about` — no route, no copy.
- `/claude` — ~15 documents named, none in the repo.

A4's bar is "all the routes that exist currently... filled in with all the
content". Against that starting position, a substantial amount of writing sits
between here and launch, and the plan does not know whose hours pay for it.

**What the plan does.** Books **11 h** in WP-06 on the conservative assumption that
prose time is **inside** the 133 h, and flags the ±11 h swing as risk **R3**. If it
is outside, the build budget gains 11 h and CUT-4 stands down.

**Scheduled earliest, not last** — it is Chai-only serial time and therefore the
stream most likely to starve silently. The M1 checklist is the detector: by the M2
exit every item is done or explicitly cut, never quietly unwritten.

**Blocks:** nothing immediately. **Decide by: 2026-08-02.** This is the single most
valuable question Chai can answer early — one sentence, ±11 h, and it determines
whether CUT-4 fires.

---

## T10 — `/claude`: index-vs-standing-HTML, build-pull-vs-copy · Q13 · **DEFAULTED**

Both sub-questions were asked and never answered.

**Default: copy the documents into `content/claude/`, with a simple index page** —
not a build-time pull from `~/Claude/`.

**Why.** A build-time pull from outside the repo breaks a clean clone and any CI
that ever exists; the repo is public and self-contained by design (PRD "Repo +
deploy"). And 15 AI-generated documents going onto a **public** repo need a
read-through each regardless, so they are being handled individually anyway —
copying is not the expensive part.

**Also inherited:** `/claude` is a content-box route, so **ADR-0008's contract
applies in full** — Portal links as real `<a href>`, content present in the
prerendered HTML before any JS runs, a real no-JS floor. "Prerendered and in the
sitemap" is the mechanical half only.

**Cost if wrong:** the copies drift from the `~/Claude/` originals. Acceptable —
these are published artefacts, not a synced mirror.

**Forcing date:** whenever WP-10 starts, which is M4 — and WP-10 is **CUT-2**, so
this may never need answering.

---

## T11 — Flash: does the pipeline work, and `.swf` vs video · Q7 · **RESOLVED — Chai ruled O4, 2026-07-28**

> **Ruling (2026-07-28).** The format fork is closed: **the catalogue is all
> `.swf`.** Everything plays through the shipped, tested `RuffleEmbed` — no
> second component, no separate route treatment, and none of the ≈6 h the video
> branch would have cost. WP-09 keeps the size it was given.
>
> **This does not retire TRIGGER-G or R5.** Format was only half the question;
> whether the ~36 unheld items are *locatable* is still open, and TRIGGER-G
> still fires CUT-3 on **2026-09-06** if they are not in hand by then. Carry
> this ruling onto the flash-ingest task when it is created at the M3
> checkpoint.

### The pipeline question — **RESOLVED by inspection, and the answer is "yes, it has a payload"**

This corrects a finding this plan was handed as verified.

- `make assets-sync` rsyncs `assets/` → `/var/www/chaipalaka/assets/`, guarded by
  an existence check.
- **`assets/` exists on this machine** — gitignored, exactly as the project's
  >1 MB rule requires ("they live in gitignored `assets/` and ship via
  `make assets-sync`"). It holds **33 MB**: `ava`, `biglittle`, `biolet`, `counter`
  as `.swf` + PNG, **and `assets/ruffle/nightly-2026-05-12/`** — precisely the
  version `RuffleEmbed.tsx:3` requests.
- So the guard would **not** print "nothing to sync". The claim that the Ruffle
  runtime is an unsynced asset and that the target has never carried a payload was
  derived from the **git** tree, where `assets/` is invisible **by design**.
- `deploy-web`'s rsync passes `--exclude='assets/'` alongside `--delete`, so a web
  deploy will not wipe synced assets. Sound.

**What remains genuinely unknown: whether `make assets-sync` has ever been run
against the box.** That is not answerable from the repo in either direction. It is
answerable in one command, and WP-02's dry-run runs it:

```sh
curl -s -o /dev/null -w '%{http_code}' \
  https://chaipalaka.com/assets/ruffle/nightly-2026-05-12/ruffle.js
```

**The acceptance criterion survives the correction:** an AC that only checks local
dev playback would pass over a broken production route. Require the **live-host**
check. Only the diagnosis changed — the guard rail was right for the wrong reason.

### The `.swf`-vs-video question — **OPEN, needs Chai (O4)**

A real fork. `.swf` files play through the shipped, tested `RuffleEmbed`; video
files do not, and need a different component and a different route treatment
(+≈6 h). The four items that exist are `.swf`, which is evidence but not an answer
for the other ~36. ≈100 MB across ~40 items is ~2.5 MB each — plausible for either.

**Blocks:** WP-09 (M4). **Decide by: 2026-09-06** — TRIGGER-G fires CUT-3 if the
source media is not locatable and classified by then. Risk **R5** is that it may
not exist in usable form at all, in which case `/stuff/flash` is re-scoped honestly
to the four pieces it has rather than promised and missed.

---

## T12 — What "simplified form" means · Q12 · **DEFAULTED**

**The tension.** A12 says the in-flight polish work is shader/three.js experimental
UX and that it stays in prod-v1 "in a simplified form". What that means concretely
was never defined.

**Default: what is already shipped, plus nothing new.** Concretely — the metaball
auras on `/lab` (task-038, shipped) stay and stay public (T7); the background scene
system stays as-is and is **curated** rather than replaced (inside WP-11);
**task-039 fat tethers is CUT-1**; task-040 parallax and task-041 field-warp were
not picked in Q15 and stay NICE; DRAFT-002 and DRAFT-003 stay NICE per A19.

**Why.** "Simplified form" alongside A19's rule (ungrilled → NICE) and A21's cuts
reads most consistently as *don't build more of it*, not as *build a reduced
version of each*. Building a reduced version of five things costs more than
building one thing.

**Cost if wrong:** the shader/three.js identity at launch is `/lab` plus the
existing background gallery, curated. If Chai wants more, the cheapest addition is
DRAFT-003 — it upgrades a surface every visitor sees on every route.

**Forcing date: 2026-08-30** — same slot as T3, and probably the same conversation.

---

## T13 — Do `/stuff` and `/` follow lifelog's composed model · Q9 · **DEFAULTED**

Q9 asked whether `/stuff` and `/` follow lifelog's model. **A9 answered only for
lifelog.**

**Default: no.** `/` stays the populated content-box landing shipped in task-026
(bespoke, `resting: 'populated'`, ambient pin); `/stuff` stays a content-box index.
Only `/lifelog` becomes a composed canvas.

**Why.** `/` was deliberately designed and shipped ten weeks ago under task-026,
including retiring the v1 letters+balloon placeholder — reopening it is a redesign,
not a rollout. And if O1 resolves to `driftScale: 0`, a composed canvas route is a
*still* route: right for a dashboard-like lifelog, wrong for a landing page that
should feel alive. Converting either would also add unbudgeted hours and force a
C-list cut.

**Cost if wrong:** `/` and `/stuff` read as consistent rather than bespoke. WP-05
covers them at the layout level and WP-11 visually, so "bespoke" is still reachable
without the composed-canvas physics treatment.

**Forcing date: 2026-08-16** (M1 checkpoint), inside WP-05's window.

---

## T14 — TASK-035 skipped while all four housekeeping items were picked · §4 block 4 · **RESOLVED as scheduled work**

**The tension** (the interviewer's, and it is fair). Q14 picked all four
housekeeping items as MUST; Q16 did not pick TASK-035. So the plan as triaged
spends hours deleting git branches while the pin feature's documented "stuck above
the screen" bug goes unverified — and pinning is the centrepiece of the entire
ladder.

**Resolution — fixed by *sequencing and sizing*, not by overriding Chai's triage:**

- **WP-01 is the first item in the plan**; WP-12 (branches + issues, 4 h) is parked
  in **M4**, where it competes with nothing.
- **TASK-035's four symptoms are individually re-tested inside WP-01**, even though
  035 itself stayed NICE. Verifying a bug is not fixing it, and A11 explicitly
  makes verification real, scheduled work. Chai's belief that it is stale is
  `[leaning]`, not `[decided]`, and nobody has checked. The symptoms were observed
  on `/test/box` during task-028 dev review, **before** 042.01–.04 landed — drift
  may have fixed all, some, or none.
- **If any symptom reproduces, TRIGGER-A fires CUT-1**, freeing ~18 h to fix it,
  and the escalation goes to Chai at the 2026-08-02 checkpoint rather than being
  absorbed.

**What is not resolved:** whether Chai *wants* 035 fixed if it reproduces. The plan
assumes yes — shipping the ladder's centrepiece with a card that strands off-screen
contradicts A4's "every route works". If the sweep reproduces a symptom, that
assumption is put to Chai rather than acted on.

---

## The decision sheet — what Chai must personally rule on

Six items. Nothing here is resolvable by the plan.

| # | Decision | Moves | Blocks | By |
|---|---|---|---|---|
| ~~**O1**~~ | **ANSWERED 2026-07-26 — STRUNG short ropes, a living composition.** See T2 for the ruling and the derived-rope-length cost it accepts. On task-033 ACs #3/#4; goes into ADR-0012 | WP-03 sized 15 h, not 12 | — | **done** |
| **O2** | **Content-authoring hours** — inside the 133 h, or outside? | **±11 h**, and whether CUT-4 fires | nothing immediately | **2026-08-02** |
| **O3** | **Delight vs triage** — A19's rule moved every delight item except the capstone to NICE, and CUT-1 removes the last one beside it. Is that the intended outcome? If one item returns, DRAFT-007 is the cheapest | launch feel | nothing before M2 | **2026-08-30** |
| ~~**O4**~~ | **ANSWERED 2026-07-28 — all `.swf`.** Chai confirmed the whole catalogue is `.swf`, not just the four in `assets/`. WP-09 keeps its sized shape: shipped `RuffleEmbed`, no second component, no video route treatment, no +6 h | WP-09's size and shape | WP-09 | **done** |
| ~~**O5**~~ | **ANSWERED 2026-07-28 — the plan default, as written.** Chai confirmed the strip list and "keep `/lab` public". Executed in task-044 and ratified by [ADR-0013](../adr/0013-canonical-host-and-hard-404.md) | ~0 h either way | M0 exit criterion 3 | **done** |
| **O6** | **ADR ratification rule** (§6.8) — keep "Claude drafts, Chai ratifies via DoD #6", or switch to "the plan decides"? | process only | nothing | any time |

**O1 is answered.** **O2 is now the outstanding one that moves real hours** — ±11 h,
answerable in a sentence, due 2026-08-02 alongside O5.
