# prod-v1 — risk & cut register

**A18 makes this the plan's primary control.** The date (2026-09-26) is fixed;
scope flexes. Demand is ≈175 h against 133 h, so **≈42 h must come out**. The
question is never *whether* to cut but *which, and when*.

Three rules govern this document:

1. **Cuts fire on triggers, not on panic.** Each entry names the observable
   condition that fires it. A cut discovered in the last fortnight is a cut taken
   badly.
2. **A cut is a deferral to a named place**, not a deletion. Every entry lands on
   the post-launch backlog with its scope intact.
3. **Every cut names the milestone whose budget it closes.** A register that only
   closes the *total* leaves individual windows over-subscribed and quietly
   unschedulable.

---

## Triggers — evaluate at every milestone checkpoint

| ID | Condition | Fires |
|---|---|---|
| **TRIGGER-A** | WP-01 escalates task-035 to MUST (any of its four symptoms reproduces under drift) | CUT-1 immediately, **and escalate** — never absorb |
| **TRIGGER-B** | Measured pace over M0+M1 is below **12 h/week** | CUT-1 + CUT-2 |
| **TRIGGER-C** | At any checkpoint, remaining demand > remaining capacity × 1.15 | Next uncut entry, repeat until the ratio holds |
| **TRIGGER-D** | O2 resolves as "prose time IS inside the 133 h" **and** more than 2 blog drafts remain unfinished at 2026-08-30 | CUT-4 |
| **TRIGGER-E** | At the 2026-08-30 checkpoint, WP-07 (responsive layout) is not complete | CUT-7 — protects mobile *coverage* by cutting mobile *sophistication* |
| **TRIGGER-F** | At the 2026-09-13 checkpoint, anything outside M4's fixed contents is still open | CUT-1 through CUT-6 all fire, whatever their individual state |
| **TRIGGER-G** | Flash source media is not locatable and format-classified by 2026-09-06 | CUT-3 |
| **TRIGGER-H** | The 2026-09-24 freeze arrives with the launch checklist unfinished | Stop all feature work; checklist only |
| **TRIGGER-I** | Any new scope is proposed after the M2 exit (2026-08-30) | **Scope freeze** — it becomes a draft, not prod-v1 work |

**TRIGGER-F is the important one.** It is the mechanism that keeps M3's capstone
protected: everything optional dies before the capstone is touched.

---

## The ordered cut list

Cut in this order. The ordering encodes what the brief protects — A21's named cuts,
A23's protect-last, A4's launch bar.

| # | Cut | Saves | Closes | Cumulative |
|---|---|---:|---|---:|
| CUT-1 | TASK-039 fat-line tethers | 18 h | **M4** | 18 |
| CUT-2 | `/claude` route | 12 h | **M4** | 30 |
| CUT-3 | Flash catalogue depth: ship ~10, not ~40 | 6 h | M4 | 36 |
| CUT-4 | Blog: publish 1–2 posts, not 5 | 4 h | **M2** | 40 |
| CUT-5 | `/stuff` bespoke composition — keep the shared shape | 4 h | **M1** | 44 |
| CUT-6 | `/about` bio → one strong paragraph | 2 h | M1 | 46 |
| CUT-7 | Mobile pin rail → existing box-edge park regime | 8 h | **M2** | 54 |
| CUT-8 | `/lifelog` reverts to a quiet content-box | 10 h | M1 | 64 |
| CUT-9 | Capstone scope reduction — **escalation, not a cut** | 8 h | M3 | 72 |

**Bolded** entries are the ones the reconciliation table
([`milestone-map.md`](milestone-map.md)) budgets to fire: CUT-5 + CUT-6 (M1),
CUT-7 + CUT-4 (M2), CUT-1 + CUT-2 (M4) = **48 h against a 42 h gap**. CUT-3, CUT-8
and CUT-9 (≈24 h) stay in reserve against the estimates being wrong.

*(CUT-6 joined the budgeted set on 2026-07-26: Chai's O1 ruling chose STRUNG short
ropes, whose authored anchor topology adds ~3 h to WP-03 and 1 h to M1.)*

---

### CUT-1 · TASK-039 fat-line tethers · **saves ≈18 h** · closes M4

**Defer to:** post-launch; the board item stays open under milestone `v2`.

**Why first.** L-sized; its central technique fork (SDF capsule in task-038's field
vs a separate node-material fat line) is explicitly unresolved on the ticket, so
its cost is unbounded; WebGPU-only, so ~18% of visitors never see it; **zero
dependents**. The delight goal it serves (A5) is carried by the protected capstone.

**What is lost.** Tether tension stays SVG (`StringLayer`) rather than a TSL
filament. Tethers still render and still communicate tension via stroke width and
opacity — task-042.03 shipped that. A fidelity cut, not a functionality cut.

**Note.** Chai picked 039 in Q15. **Firing this reverses a stated preference and
must be surfaced at the checkpoint that fires it, not quietly applied.**

---

### CUT-2 · `/claude` route · **saves ≈12 h** · closes M4

**Defer to:** post-launch; create the board task at the M3 checkpoint so it is not
lost even if never built.

**Why second.** The only genuinely *new surface* on the MUST list — every other
MUST finishes something that exists. New surfaces are where estimates break, and
both of its design sub-questions are unsettled (Q13, T10). It also inherits
ADR-0008's full progressive-enhancement contract, which is real work, not a
checkbox.

**Why not first.** Chai named it unprompted in A5 as part of "my entire vision for
a solid v1", and the content already exists. It should survive if anything optional
does.

---

### CUT-3 · Flash catalogue depth: ship ~10, not ~40 · **saves ≈6 h** · closes M4

**Defer to:** post-launch, incrementally — once the pipeline has run, each addition
is one `assets-sync` plus a content entry.

**Why here.** The *pipeline* matters; the *catalogue size* does not. Ten good
pieces make the route real; thirty more make it complete, and completeness is
exactly what a fixed date trades away. This is also the cut that most reduces the
≈100 MB payload risk, which is why TRIGGER-G exists independently of the schedule
triggers.

---

### CUT-4 · Blog: publish 1–2 posts, not 5 · **saves ≈4 h** · closes M2

**Defer to:** ongoing post-launch writing.

**Why here.** Verified: four of five posts are `draft: true`. Finishing four essays
is Chai's own writing time, and **writing does not compress under deadline
pressure — it just gets worse.** A launch with two good posts and a live site beats
one with five rushed ones.

**What is lost.** A thin `/blog` at launch. Note `/blog` must still *look* right
with few posts — that is WP-05/WP-11's problem and does not get cut.

---

### CUT-5 · `/stuff` bespoke composition · **saves ≈4 h** · closes M1

**Defer to:** post-launch.

A6 asks for per-route composed layouts "likewise for the other routes like stuff".
`/stuff` is an index over one populated section; it can wear the shared content-box
shape and still read deliberate once the capstone has run.

---

### CUT-6 · `/about` bio → one strong paragraph · **saves ≈2 h** · closes M1

**Defer to:** post-launch expansion.

The *route* is a MUST (task-034, picked in Q14) and stays; its *depth* is elastic.
A short, well-made about page is not a defect. AC "Portal links in the bio"
survives — one paragraph carries two links.

**Budgeted to fire.** M1 is loaded at 35 h against 30, and CUT-5 alone leaves 1 h
over. This is the cheapest thing in M1 that closes it without touching a route's
existence.

---

### CUT-7 · Mobile pin rail → existing box-edge park regime · **saves ≈8 h** · closes M2

**Defer to:** post-launch.

**More likely than not to fire.** M2 is loaded at 38.75 h against 30, and this is
its resident cut. Stated at planning time rather than discovered on 2026-08-30.

**Why here and not earlier.** It is the first cut that touches A4's explicit launch
bar ("works on both mobile and desktop"), so it sits below everything optional. But
it degrades *gracefully*: the edge-anchored park regime already exists and works
(task-024), so mobile pins park at the content-box edge instead of collecting on a
purpose-built rail. Mobile *keep* still functions; it is just less considered.

**Hard floor:** WP-07 (responsive layout) is **not** cuttable. A site that does not
lay out on a phone fails A4 outright. If WP-07 itself is ever at risk, the correct
move is CUT-8, not cutting WP-07.

**If cut**, record the divergence from spec §4 in the spec, in the same branch —
project rule: a slice's design change updates the spec in the same commit.

---

### CUT-8 · `/lifelog` reverts to a quiet content-box · **saves ≈10 h** · closes M1

**Defer to:** post-launch — the composed-canvas treatment becomes its own task.

**Why this late.** It reverses A9, an explicit `[decided]`. That is a real reversal
and **must be surfaced to Chai, never applied silently.** But it is the last
structural cut available before the capstone, and it is safe: the quiet content-box
path is what spec §8, `CONTEXT.md` and task-033's own description already describe,
so reverting is *less* work than proceeding. It also makes ADR-0012 unnecessary.

**What is lost.** Lifelog reads like the blog rather than like a composed canvas;
A6/A9's "creative use of space" moves post-launch.

---

### CUT-9 · Capstone scope reduction · **saves ≈8 h** · **ESCALATION, NOT A CUT**

**Reduce to:** tokens + card chrome + content-box typography only, dropping the
motion vocabulary and the per-route polish.

**Why last, and why it should never fire.** A23 names the capstone plus general UX
polish as the protect-last item; A18 fixes the date. This entry exists because a
register with an unreachable bottom is dishonest, not because it is expected to be
used.

**If TRIGGER-F has fired and this is still needed, the conversation is with Chai
about A18 vs A23.** The plan has no authority to resolve that tension by itself.
Slip-vs-ship-undesigned is Chai's ruling, and it is **never a silent cut.**

---

## Risks — things to watch that no cut fixes

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| **R1** | **Structural over-commit.** 155 h scope + 20 h overhead vs 133 h. Personal-project estimates usually run long, not short | whole plan | The register itself: cuts pre-agreed and pre-assigned to milestones, so a slip costs a decision, not a re-plan. Burn reconciled at every exit |
| **R2** | **task-035's symptoms may be live.** Pinning is the ladder's centrepiece; a card "stuck above the screen" at launch is worse than a missing effect | ladder credibility | WP-01 in week 1 converts unknown → known by 2026-08-02; the fix is pre-funded by CUT-1 via TRIGGER-A |
| **R3** | **Content authoring is Chai-only serial time**, and may or may not be inside the 133 h (O2, ±11 h) | M2 exit | Scheduled *earliest*, not last; the M1 checklist is a starvation detector — every item done or explicitly cut by the M2 exit, no silent starvation |
| **R4** | **Mobile is a broad unknown.** One layout media query exists today; 27 h across WP-07+WP-08 is moderate confidence at best | M2 exit | Responsive before rail, so the cuttable half is last; CUT-7 pre-agreed |
| **R5** | **Flash media may not exist in usable form**, and the `.swf`-vs-video question (O4) was never answered | `/stuff/flash` thin or unbuildable | TRIGGER-G forces the question by 2026-09-06, early enough to cut to CUT-3 or re-scope honestly to the four pieces that exist |
| **R6** | **Secondary-project contention.** Space Miner is primary; 15 h/week is a planning figure over a stated 10–20 range. At 10 h/week capacity is 89 h, not 133 — 2× over rather than 1.3× | plan validity | TRIGGER-B watches *measured* pace, not assumed pace, from the first checkpoint |
| **R7** | **Lifelog design churn.** Composed canvas is a new route archetype with unbounded polish appetite | M1 exit | ADR-0012 ratifies mechanism *and* shipping minimum **before any build hour**; arrangement *polish* belongs to WP-11, not WP-03 |
| **R8** | **~18% of visitors see the static fallback** (ADR-0009), on a launch judged partly on "admire the site itself" | perceived quality | WP-11 exit criterion 4: the fallback look is designed, not residual |
| **R9** | **Deploy pipeline rust.** The infrastructure works, but nothing of this size has shipped through it and `assets-sync` may never have run against the box | launch-day failure | WP-02's dry-run in M0 and WP-14's rehearsal ~2026-09-19, plus a preserved rollback artifact |
| **R10** | **Board staleness may exceed the one confirmed instance** (DRAFT-006). The true rate is unknown | unknown work mid-plan | WP-01 quantifies it before anything is built on it; findings pinned onto the consuming tasks via `--ac` / `--append-notes` |
| **R11** | **This plan's own inherited premises.** One launch-critical finding it was handed (flash pipeline broken) was **false on inspection** — verified against the git tree, where `assets/` is gitignored by design | plan validity | Every inherited "verified" claim was re-checked against `main` this session; the corrections are in [`README.md`](README.md). Re-verify again before ticketing anything downstream |
