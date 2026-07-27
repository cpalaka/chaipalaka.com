# prod-v1 — work pieces

Every piece of work in the plan, **independently sized**, with dependencies,
confidence, and its owning milestone and workstream.

> **On the estimates.** Generated from the repo, not adopted from the brief's §4
> table (which the brief itself flags as "±50%, don't anchor on them") and not
> adopted from either input roadmap. Where I land materially differently from an
> input, I say so and why. Ranges are honest; the midpoint is what the schedule
> uses.
>
> **Confidence:** high = shape and code both known · moderate = shape known, cost
> uncertain · low = the shape itself is unsettled.

Streams: **B**uild · **D**esign · **C**ontent · **O**ps.

---

## Summary

| ID | Piece | Stream | M | Range (h) | Mid | Conf |
|---|---|---|---|---|---:|---|
| WP-01 | Board staleness verification sweep | O | M0 | 4–7 | 5 | high |
| WP-02 | Prod launch hygiene + deploy dry-run | O | M0 | 6–10 | 8 | mod |
| WP-03 | `/lifelog` → composed canvas (task-033) | B | M1 | 12–19 | 15 | mod |
| WP-04 | `/about` route build (task-034) | B | M1 | 4–6 | 5 | high |
| WP-05 | Per-route composed layout design | D | M1 | 6–11 | 8 | mod |
| WP-06 | Content authoring, per route | C | M1–M2 | 8–15 | 11 | **low** |
| WP-07 | Responsive layout foundation | B | M2 | 13–20 | 16 | mod |
| WP-08 | Mobile pinned-card rail + touch model | B | M2 | 9–14 | 11 | mod |
| WP-09 | Flash catalogue ingest (~40 items) | C+O | M4 | 7–16 | 10 | **low** |
| WP-10 | `/claude` route (≈15 docs) | B+C | M4 | 9–14 | 11 | mod |
| WP-11 | Design capstone (task-030) | D | M3 | 22–30 | 26 | mod |
| WP-12 | Housekeeping — branches + GH issues | O | M4 | 3–5 | 4 | high |
| WP-13 | Fat-line tethers (task-039) | B | M4 | 14–24 | 18 | **low** |
| WP-14 | Launch checks, rehearsal, go-live | O | M4 | 5–9 | 7 | mod |
| | **Sum of midpoints** | | | | **155** | |
| | Process overhead (≈16 tasks × 1.25 h) | | | | **20** | |
| | **Total demand** | | | | **≈175** | |
| | **Capacity (brief §1, pinned)** | | | | **133** | |
| | **Gap to close by cutting** | | | | **≈42** | |

**Sanity band.** The brief's grading held a pre-registered independent estimate of
**130–218 h**. 155 h of scope sits mid-band. One input roadmap landed 163 h + 18 h
overhead = 181; the other landed 116 h core — *below the band's floor*, and it
booked zero hours for the adversarial-review gate it added to eight of its own
tasks. This plan keeps the overhead line.

**Honest note on convergence.** My total lands close to the higher input's, which
is partly independent agreement and partly anchoring risk — I had read both before
estimating. Two per-piece numbers move in *opposite* directions from that input for
verified reasons, which is the part that is real signal: **flash is cheaper**
(WP-09: the pipeline and Ruffle runtime already exist locally — the input's
"pipeline is broken" premise is false) and **launch hygiene is dearer** (WP-02:
two findings the inputs did not have — no prerendered 404 at all, and a sitemap
covering 4 URLs).

---

## Dependency graph

```
WP-01 staleness ──┬─→ (may escalate task-035 → MUST, fires CUT-1)
                  └─→ WP-03, WP-07, WP-08   [verified premises before building]

WP-02 hygiene + dry-run ──→ WP-09 flash ingest ──→ WP-14 launch checks
        └─→ 404 · dev routes · sitemap · canonical host   [all launch-visible]

ADR-0012 gate ──→ WP-03 lifelog ──┐
WP-06 bio prose ──→ WP-04 /about ─┼─→ WP-05 composition ──→ WP-11 CAPSTONE
                                  │                              ↑
WP-07 responsive ──→ WP-08 rail ──┴──────────────────────────────┘
                                     (the capstone restyles a finished shape)

WP-06 content ──→ WP-04 (bio), WP-09 (flash notes), WP-10 (/claude framing)

WP-13 fat tethers — no dependents. Isolated. First cut.
```

**The load-bearing ordering rule:** WP-11 (capstone) runs *after* WP-07/WP-08,
because designing a desktop-only shape and then making it responsive means
designing twice. This is the project's own ratified spine-first sequencing
(CLAUDE.md, v2 spec §15) — **mobile responsiveness is spine, not design.**

---

## Where the two input roadmaps disagreed

Three conflicts, resolved rather than averaged.

### 1 · Capacity — re-estimated fresh, then reconciled per milestone

One input said 163 h + 18 h process = 181 h (1.4× over); the other said 116 h core
+ 16 h stretch. **Resolution: re-estimate independently (≈155 h + 20 h = 175 h,
1.32× over), keep the process-overhead line, and adopt the *other* input's
per-milestone discipline** — every milestone holds its own piece sizes and names
the cut that closes it. See [`milestone-map.md`](milestone-map.md) § Budget
reconciliation. A plan whose total closes while M2 holds 42 h of work in a 30 h
window has not scheduled anything.

### 2 · Lifelog mechanism — surfaced as a decision, not picked · **Chai ruled (b), 2026-07-26**

Both mechanisms are verified sound and neither dominates, so the plan surfaced the
fork rather than choosing. **Chai ruled O1 on 2026-07-26: option (b), STRUNG cards
on short ropes — a living composition.** Recorded on task-033 ACs #3/#4 and
ratified in ADR-0012. Both options stay documented: (a) is the in-place fallback if
the anchor topology proves unworkable in build.

| | **(a) `driftScale: 0`** — not chosen | **(b) STRUNG cards, bounded drift** — **CHOSEN** |
|---|---|---|
| What it is | A still composition you can push around | A living composition held by short ropes |
| Verified | `PageSpec.driftScale?: number` exists (`PageSpec.ts:61`); `usePageDef.ts:28` pushes it; `PhysicsWorld.ts:800` zeroes the impulse speed; `:853` binary-gates prose repel off | `CardSpec.parent: ParentRef` + authored anchors still exist; CONTEXT.md **Strung**: "drifts *bounded*, held within rope reach of its static anchor"; ADR-0010 dec. 3 backs it |
| Cost | No ambient motion on `/lifelog` at all | Tether length is *derived* from parent-anchor→layout distance, so "short ropes" pins cards near a static anchor — which fights the "different sized cards arranged creatively across the page" the route is for. **A card authored mid-viewport has no short rope available** unless an anchor is authored for it |
| Build cost | ~1 field + the spawn-kick fix | ~1 field + **authored anchor topology** + the same fix |
| Reversible? | Yes — one field | Yes, but the anchor topology is authored work to unwind |

**The chosen option costs the plan ~3 h and one new deliverable.** WP-03 sizes at
**15 h rather than the ~12 h `driftScale: 0` would have cost**, because the anchor
topology has to be *designed* rather than derived — the rope-length problem is no
longer an unclosed loop but an explicit acceptance criterion (task-033 AC#4). It is
the most likely place for WP-03 to run long (**R7**), and option (a) remains the
in-place fallback: one field, no new authoring, a mechanism change inside ADR-0012
rather than a re-plan.

**The spawn-kick fix (`CardImpl.tsx:90`) stays in scope.** Under (a) an unfixed
kick destroys the composition at mount; under the chosen (b) ropes recapture the
cards, so it instead makes arrival visibly jumpier than authored — on the route
whose entire point is an authored arrangement.

**ADR-0012 was required either way.** Both mechanisms produce a **box-less**
`/lifelog`, and that is the part needing ratification — see below. The mechanism is
one section of the ADR, not its reason for existing.

### 3 · Capstone placement — M3 of five, with an escalation clause

One input put the capstone at M3 of M0–M4 (13 days runway, nothing sharing the
window); the other at M4 of M1–M5 (6 days runway, task-039 running concurrently).
**Resolution: take the earlier placement, keep the other's escalation clause.** A
protect-last item scheduled dead last is the first thing squeezed. CUT-9 exists so
the register has an honest bottom, and firing it **escalates to Chai** (A18 date-
fixed vs A23 protect-last) rather than being applied unilaterally.

---

## The ADR-0005 problem neither input named

Both input roadmaps propose a **box-less `/lifelog`**. Neither cites **ADR-0005**,
whose decision 1 is: *"Each route is a fixed, solid, scrollable content box."* A
box-less route is a departure from that decision, not a detail of drift tuning.

**ADR-0011** is the governing precedent and it is explicit: `/lab` was approved as
a box-less route by Chai personally, and *"if the aura ever moves onto reading
routes, that becomes its own decision."* A **second** box-less route is exactly the
case that precedent anticipates.

**Therefore ADR-0012 is a gate, not a deliverable:** drafted, reviewed, and signed
off (DoD #6) **before any lifelog build hour**. It records (i) the box-less
carve-out and its departure from ADR-0005 dec. 1, (ii) the drift mechanism Chai
rules on in O1, (iii) the shipping minimum, and (iv) the three documents amended in
the same branch — v2 spec §8's route table, `CONTEXT.md`'s lifelog content-box
language, and task-033's own description.

---

## WP-01 · Board staleness verification sweep · O · M0 · 4–7 h · mid **5** · high

A timeboxed sweep giving each of the 19 board items a dated verdict, with two
getting real re-testing.

- **TASK-035's four symptoms, individually**, against current `main` under drift.
  Chai believes it is stale (A11, `[leaning]`); nobody has checked. The symptoms
  were observed on `/test/box` during task-028 dev review, **before** the drift
  conversion landed (042.01–.04, 2026-07-01→03). Verify **per-frame or by conserved
  invariant** — a single-frame snapshot of a soft system is meaningless.
- **The brief's own unverified interviewer reading** — that `PinnedCard.parkAt`'s
  reduced-motion branch places a top-parked card at `edgeAnchor.y + parkRest`,
  *inside* the box over the prose, while the non-reduced path lets prose repel
  settle it outside. **Confirm or refute it; do not inherit it as fact.**
- **DRAFT-006's premise**, the one confirmed-stale instance: it complains a parked
  card "hangs and swings as a live physics pendulum off the box", but ADR-0010 set
  engine gravity to `{0,0}` on every route. There is no pendulum. Decide whether
  the underlying concern (parked-card *feel* under drift) survives.

**Why first.** Everything downstream is scheduled against board claims. Five hours
to learn which are true is the cheapest insurance in the plan, and it is the only
item whose *result* can invalidate the plan around it — its output is
**TRIGGER-A**, not a document.

**Residual:** the sweep can only verify what it can observe. Ungrilled drafts have
no implementation to test; their verdict is "premise unchecked", which is itself
useful.

---

## WP-02 · Prod launch hygiene + deploy dry-run · O · M0 · 6–10 h · mid **8** · mod

Four launch-visible defects and one dry run, batched because they all touch the
same two files and the same human gate.

1. **The 404, both halves (≈3 h).** `deploy/Caddyfile` has zero `handle_errors`
   blocks — **and** the prior `web/dist/` contains no `404.html` and no `404/`
   directory, so `vite-react-ssg` never prerenders the splat route. Emit a static
   404 *and* add the Caddy block. Also add a `try_files` fallback: without one, any
   client-only route (e.g. `/sandbox/cards`) returns Caddy's 404 in production.
   **`deploy/` changes are propose-then-apply.**
2. **Dev-route disposition (≈1 h).** `vite.config.ts:170–174`'s filter ships
   `/test/*`, `/test/box-b`, `/lab` and `/sandbox/scenes/*` as real static
   directories. A one-line filter change executes whatever Chai rules (O5); the
   default is in [`open-questions.md`](open-questions.md) §T7.
3. **Sitemap (≈1.5 h).** `vite-plugin-feeds.ts:118` hardcodes
   `staticRoutes = ['/', '/blog']`; the emitted sitemap carries **4 URLs**. Derive
   it from the real public route set, add a test, and re-check after (2).
4. **Canonical host (≈0.5 h).** The Caddy site block serves apex and `www` with no
   redirect; the feed `baseUrl` says apex, `make deploy-web` says `www`. Pick one,
   redirect the other.
5. **Deploy dry-run (≈2.5 h).** `make deploy-web` + `make assets-sync` end-to-end
   against the real box, **human-gated**, ending in the live-host `curl` that
   settles the flash question ([`README.md`](README.md) finding 2). Also drafts
   `docs/process/launch-checklist.md`.

**Blocks:** WP-09 (the flash pipeline must be proven before 40 items ride it) and
WP-14.

---

## WP-03 · `/lifelog` → composed canvas · task-033 · B · M1 · 12–19 h · mid **15** · mod

**What.** Convert `/lifelog` from the v1 scatter card-chain to a **box-less
composed canvas route** with an authored arrangement of differently-sized cards
carrying the four existing live widgets.

**Verified starting state:** `routes/Lifelog.tsx` still imports `card/Page` and
`pageSpecFromLayout` — it is genuinely the v1 scatter shape.

**Scope.**
- **ADR-0012 first — a gate, not a step.** See above.
- Rewrite off `card/Page` scatter onto a composed layout under `CanvasLayout`. The
  `/lab` route (ADR-0011) is the working shape precedent: box-less, `CanvasLayout`,
  authored card set.
- **Apply the ruled mechanism (O1, Chai 2026-07-26): STRUNG cards on short ropes.**
  Every composed card tethers to an authored static anchor so its wander is
  bounded; route `driftScale` is authored low but **> 0**, so the cards stay alive.
- **Author the anchor topology, and record it.** A tether's length is *derived*
  from `distance(parentAnchorPos, cardLayoutPos)`, so any card placed mid-viewport
  needs its own static anchor or it gets a long rope and a loose composition. This
  is the piece's real design work and the ~3 h that separates it from the
  `driftScale: 0` path — task-033 AC#4 makes it explicit rather than implicit.
- **Fix the spawn-kick ordering gap as a class, not an instance.** `CardImpl.tsx:90`
  reads `world.getDriftScale()` at spawn, before `usePageDef` has applied the
  route's value; `PhysicsWorld.driftScale` defaults to `1`. Prefer ordering the
  `driftScale` set ahead of card registration over adding a second synchronous read
  at the spawn site — the reduced-motion branch already took the latter route and
  that is why the general case was left behind.
- **`driftScale` is authored route-side, NEVER in an Atelier-regenerated
  `.layout.ts`** (drift spec D7) — a whole-file regen silently drops it, and the
  failure is invisible. `Lab.layout.ts:6` carries exactly this warning.
- Books / now-playing / films / github widgets move into card content, fetches
  unchanged. **Zero new adapters** (T4's default minimum).
- No-JS floor, tests, and the three doc updates the change forces.

**Why lower than the brief's 20–35 h.** That figure explicitly bundles "the
ADR-0010 composition problem". No engine feature is needed — the rope machinery,
`driftScale`, and the bounded-drift semantics all already exist and were verified
in source. The ADR gate, the authored anchor topology, and the spawn-kick class fix
are what keep it at 15 rather than 8.

**Depends on:** ADR-0012 ratification, WP-01. **Blocks:** WP-05, WP-11.

---

## WP-04 · `/about` route build · task-034 · B · M1 · 4–6 h · mid **5** · high

Greenfield `/about` as a quiet content-box route: route entry, component,
prerender, no-JS floor, Portal links in the prose. Verified: no `/about` in
`App.tsx` today.

**Why cheap.** The content-box + reading-substrate shape is shipped and reused
(`ContentBoxLayout`, `ReadingSubstrate`, `BlogPostReader`) — a fourth instance of a
working pattern. The bio *copy* is WP-06, separated deliberately so its risk shows
up in the content stream where it belongs.

**Depends on:** WP-06 (bio copy). **Blocks:** WP-05.

---

## WP-05 · Per-route composed layout design · D · M1 · 6–11 h · mid **8** · mod

A6/A9: each route gets its own custom composed layout. **This is layout
composition, not the visual system** — that is WP-11's.

**Already done, no work:** `/blog` and `/blog/:slug` shipped the vertical
reading-oriented composition A6 describes, and `/` shipped its bespoke populated
landing — both in task-026. **In scope:** `/stuff`, `/stuff/flash`, 404.
**Out of scope by decision:** `/lifelog` (inseparable from WP-03) and `/` (T13 —
reopening a route deliberately designed ten weeks ago is a redesign, not a rollout).

**CUT-5** removes `/stuff` from this piece.

**Depends on:** WP-03, WP-04. **Blocks:** WP-11.

---

## WP-06 · Content authoring, per route · C · M1–M2 · 8–15 h · mid **11** · **low**

**What.** The words. Bio prose for `/about`; the four `draft: true` blog posts
finished or cut; lifelog card copy; route intros; `/claude` index framing.
*(Flash per-item metadata is inside WP-09, not double-counted here.)*

**Why confidence is low.** Brief §6.9 is `[unanswered]`: nobody established whether
Chai's prose-writing time comes out of the 133 h. **This plan assumes it does** —
the conservative reading — and books 11 h. If it does not, the build budget gains
11 h and CUT-4 stands down. The assumption is stated, not hidden, and it is **O2**.

**Verified content reality:** `content/blog/` holds 5 posts, **4 of them
`draft: true`** — production `/blog` lists exactly **one**. `content/stuff/flash/`
holds **4** entries (`ava`, `biglittle`, `biolet`, `counter`) against Chai's stated
~40. No `/about` copy. No `/claude` documents in the repo. A4's "every route filled
with content" reads very differently against one live blog post.

**Scheduled earliest, not last** — this is Chai-only serial time and the stream
most likely to silently starve. Its M1 checklist is the starvation detector.

---

## WP-07 · Responsive layout foundation · B · M2 · 13–20 h · mid **16** · mod
### **Hard floor — never cut**

**What.** The site's first real responsive system: a breakpoint layer, the content
box and reading substrate at narrow widths, frame-bar thumb-reach (PRD story 44,
no implementation today), the composed `/lifelog` at phone width, and
`/stuff/flash` player sizing.

**Verified starting position:** `web/src` contains **seven** `@media` blocks, of
which **exactly one is a layout query** (`contentbox/ReadingSubstrate.css:21`,
`max-width: 640px`). The rest are `prefers-reduced-motion` (×4) and
`prefers-color-scheme` (×2). **There is no responsive system to extend — this is a
build, not a pass.**

Touch *gestures* are in genuinely decent shape (brief §3 is correct):
`PeekTriggers` and `PortalNav` branch on `matchMedia('(hover: hover)')`, and
`pinGesture` is PointerEvent-based. That is why the gap is layout, and why WP-08
splits off.

**Why it is never cut.** A site that does not lay out on a phone fails A4 outright.
If the schedule reaches the point where WP-07 itself is at risk, the correct move
is CUT-8, not cutting WP-07.

**Blocks:** WP-08, WP-11.

---

## WP-08 · Mobile pinned-card rail + touch model · B · M2 · 9–14 h · mid **11** · mod
### **CUT-7**

Spec §4's mobile spatial model: word-anchored floating cards are desktop-only; on
mobile, previews collect at a bottom rail/sheet and pinned cards live on that same
bottom edge, recall-able to their word's scroll position. Carries the `armPressMs`
reconcile (`pinTuning.armPressMs = 200` vs PRD story 42's ~350 ms).

**Verified net-new:** `rail` appears **nowhere** in `web/src`. *(The brief records
it as "a comment in `PeekTriggers.tsx:138`"; that line's comment actually reads
"mobile tap → bottom overlay". The task-022 mobile bottom overlay is the real
precedent and is what the rail generalises.)*

**CUT-7 degradation:** mobile pins reuse the shipped box-edge park regime
(task-024) instead of a purpose-built rail. Keep still functions; it is just less
considered. If cut, record the divergence in the spec **in the same branch**.

**Depends on:** WP-07, WP-01 (auto-park/recall is exactly what task-035 documents
as flaky — build on it only after its verdict).

---

## WP-09 · Flash catalogue ingest · C+O · M4 · 7–16 h · mid **10** · **low**

**What.** Get ~40 flash pieces (≈100 MB claimed) onto the box and playing, with a
content entry each.

**Verified state — and the input roadmaps had this wrong:**

- `assets/` **does exist** on this machine — gitignored, exactly as the project's
  >1 MB rule requires. It holds **33 MB**: `ava`, `biglittle`, `biolet`, `counter`
  as `.swf` + PNG, **and** `assets/ruffle/nightly-2026-05-12/` — the precise
  version `RuffleEmbed.tsx:3` requests.
- So `make assets-sync`'s guard would **not** print "nothing to sync"; the pipeline
  has a real payload waiting.
- `make deploy-web`'s rsync passes `--exclude='assets/'` alongside `--delete`, so a
  web deploy will not wipe synced assets. That part is sound.
- **What is actually unknown:** whether `assets-sync` has ever been *run against
  the box*. Only a live-host `curl` settles it — WP-02's dry-run does exactly that.

**So this piece is content ingest, not pipeline construction** — which is why it
sizes lower than an input roadmap's 13 h and moves to M4 as cuttable. Scope:
locate/classify the remaining ~36 items (**`.swf` vs video is O4, unanswered**);
convert if needed; extend `assets/`; `make assets-sync` (human-gated); author ~36
content entries; **verify playback on the live host, not locally** — an AC that
only checks local dev playback would pass over a broken production route.

**Low confidence** because the format question is open: `.swf` plays through the
shipped, tested `RuffleEmbed`; video does not and needs a different component and
route treatment (+6 h). **CUT-3** ships ~10 pieces instead of ~40.

**Depends on:** WP-02.

---

## WP-10 · `/claude` route · B+C · M4 · 9–14 h · mid **11** · mod · **CUT-2**

A route for Claude-generated content — teach lessons, recipes, tournament results,
documentation; ≈15 documents, much already HTML (A5, A13).

**Two sub-decisions the brief left open** (Q13): index/browser vs standing HTML,
and build-time pull from `~/Claude/` vs copy into `content/`. **Plan default:** copy
into `content/claude/` with a simple index — a build-time pull from outside the
repo breaks a clean clone and the public-repo hygiene rule. Recorded as T10.

**Why 9–14 against A13's flat "a weekend".** A weekend at this pace is ~12 h, so we
broadly agree — but only if the documents need no per-document cleanup. **The repo
is public.** Fifteen AI-generated documents need a read-through each for anything
personal, half-finished, or bad out of context. That review is most of the upper
range.

**Inherits ADR-0008's contract.** `/claude` is a content-box route, so its Portal
links must be real `<a href>`, its content present in the prerendered HTML before
any JS runs, and its no-JS floor real — not just "prerendered and in the sitemap".

---

## WP-11 · Design capstone · task-030 · D · M3 · 22–30 h · mid **26** · mod
### **PROTECTED**

**What.** The single coherent design pass over the working whole: card chrome
(title bar, body, outline, highlight states), preview/Portal/Pocket/external
styling, content-box type/colour/spacing, the motion vocabulary (spec §15 easing
and duration bands), both themes, the `--text-*` → `--font-size-*` token bug —
**plus** mobile viewports, the static-fallback look for the ~18% without WebGPU
(ADR-0009 — designed, not residual), and background-scene curation (which existing
scenes ship; authoring new ones is DRAFT-003, deferred).

**Why protected.** A23: this plus general UX/look-and-feel polish is the one thing
Chai would slip the date for. A18 fixes the date. Reserving M3 and cutting around
it is the only way both survive.

**Why 22–30 and not the brief's 20–30.** The surface it must cover grew by
`/about`, a composed `/lifelog`, and a mobile layout that did not exist when that
estimate was made — and A23's "general UX polish" is broader than the ticket's two
current ACs.

**Does not own** the spec §16 art-direction follow-ups, deliberately split into
DRAFT-002/003/004 on 2026-06-19. Do not let them creep back under "polish" — that
split is what gives the capstone a finite surface.

**Depends on:** WP-03, WP-04, WP-05, WP-07, WP-08 — *everything structural*.

---

## WP-12 · Housekeeping · O · M4 · 3–5 h · mid **4** · high

TASK-031 (delete ~90 stale local branches, each confirmed obsolete rather than
blind-deleted — the 2026-06-09 history rewrite orphaned most; local only, remote
deletions need confirmation) and TASK-032 (triage/close stale GitHub issues with a
pointer to the board).

**Recorded gotchas:** `gh` writes fail TLS in the sandbox (`OSStatus -26276`) — run
each with the sandbox disabled — and **every `gh` write is human-gated**.

**On the sequencing jab.** Brief §4 fairly notes the plan "spends hours deleting git
branches while the pin feature's documented bug goes unverified". Answered by
*sequencing*, not by overriding Chai's Q14 triage: WP-01 is the first item in the
plan, and WP-12 is parked in M4 where it competes with nothing.

---

## WP-13 · Fat-line tethers · task-039 · B · M4 · 14–24 h · mid **18** · **low**
### **CUT-1**

TSL-rendered tethers whose width and colour track tension; the technique fork (SDF
capsule inside task-038's metaball field vs a separate node-material fat line) is
**explicitly unresolved on the ticket**.

**Why first to cut.** L-sized; its central technique decision is unresolved, so its
cost is unbounded; it is WebGPU-only, so ~18% of visitors never see it; it has
**zero dependents**; and the delight goal it serves (A5) is carried by WP-11, which
is protected. Cutting it costs the plan nothing structural.

**Chai picked 039 in Q15**, so firing CUT-1 reverses a stated preference — it must
be flagged at the checkpoint that fires it, never applied quietly.

---

## WP-14 · Launch checks, rehearsal, go-live · O · M4 · 5–9 h · mid **7** · mod

**Rehearsal ~2026-09-19** — a full human-gated `make deploy-web` + `make
assets-sync` a week before launch, to a state Chai accepts being briefly public.
Proves rsync, TLS, `/api/*` and the asset path before it matters.

**Rollback** — copy the previous `/var/www/chaipalaka` aside on the box before any
overwrite. One `cp -r`; the coming-soon page is a usable floor.

**Checklist** — RSS validity, sitemap vs the real public route set (which WP-02
changed), OG tags per route, no-JS floor per content-box route, reduced-motion
pass, `/api/*` liveness, secret-scan (zero matches), prerender check
(`data-server-rendered`). Then the production deploy and post-deploy verification
on the live host, mobile and desktop.

**Everything here is human-gated.** Anything touching the box — `make deploy*`,
`assets-sync`, `ssh chaipalaka`, any rsync to the server — is confirm-first;
modifying `deploy/` is propose-then-apply.

**Launch infrastructure is not a project.** Brief §3 is right: Caddy, the systemd
unit, the API service and the deploy targets all exist and work. The coming-soon
page is a stale deployed artifact, not a configuration problem.
