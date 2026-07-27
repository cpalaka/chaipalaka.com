# Workstream — Design

The protected stream. Layout composition first, then one coherent visual pass over
the working whole.

**Pieces:** WP-05 per-route composed layout design · WP-11 the capstone (task-030)
**Budget:** ≈34 h of the ≈155 h scope total — 26 of them M3's reserved window.

---

## Why this stream is sequenced late, and why that is not a risk

The project ratified spine-first sequencing twice — CLAUDE.md's design-sequencing
rule and v2 spec §15 — on the reasoning that designing card chrome before the
mechanic settles is designing in a vacuum. A23 then made the capstone the
**protect-last** item: the one thing Chai would rather slip the date than launch
without.

Those two facts pull in opposite directions under a fixed date (A18). The
resolution:

> **Reserve M3 (2026-08-31 → 2026-09-13, 30 h) for the capstone and cut around
> it.** No register entry touches TASK-030 before CUT-9, and CUT-9 is an
> **escalation to Chai**, not a unilateral cut.

So the capstone is late *and* safe. Three mechanisms carry that:

1. **It is not the last milestone.** M3 of M0–M4, finishing **13 days before
   launch**, with M4 reserved for launch and nothing sharing M3's window. The
   failure mode this avoids is the usual one — a design pass scheduled dead last,
   then squeezed to nothing by everything that ran over.
2. **TRIGGER-F.** At the 2026-09-13 checkpoint, anything outside M4's fixed
   contents is still open ⇒ CUT-1 through CUT-6 all fire, whatever their individual
   state. Everything optional dies before the capstone is touched.
3. **CUT-9 escalates rather than cuts.** If the capstone's core is at risk, A18
   (date fixed) collides with A23 (protect-last, "rather slip") and only Chai
   resolves slip-vs-ship-undesigned. **Never a silent cut.**

**What must be true before M3 opens:** every structural surface is final —
`/lifelog` composed, `/about` live, mobile laid out, per-route compositions
designed. If any of those is still moving on 2026-08-31, the capstone is designing
a moving target and the correct response is a **cut, not a slip**.

---

## WP-05 · Per-route composed layout design · M1 · 6–11 h

A6 and A9: each route gets its own custom layout. **This is layout composition, not
the visual system** — that is WP-11's.

**Already done, no work:** `/blog` and `/blog/:slug` shipped the vertical
reading-oriented composition A6 describes ("one main scrollable... more of a
vertical layout"), and `/` shipped its bespoke populated landing — both task-026.

**In scope:** `/stuff` · `/stuff/flash` · 404.

**Out of scope by decision:** `/lifelog`'s composition is authored inside WP-03
(inseparable from the mechanism work); `/` is not reopened
([`open-questions.md`](open-questions.md) §T13 — reopening a route deliberately
designed ten weeks ago is a redesign, not a rollout).

**CUT-5** removes `/stuff` from this piece — it wears the shared content-box shape
and still reads deliberate once the capstone has run.

---

## WP-11 · The capstone · task-030 · M3 · 22–30 h · **PROTECTED**

TASK-030 in full, **plus** A23's "general ux design look and feel polish", which is
broader than the ticket's two current ACs and should be read into its scope.

### Owns

- **Card chrome** — title bar, body, outline, highlight states.
- **Preview / Portal / Pocket / external** styling.
- **Content-box** typography, colour, spacing.
- **The `--text-*` token bug** — `ReadingSubstrate.css` and `BlogPost.css`
  reference `--text-sm/-xs/-2xl/-3xl`, which do not exist in `tokens.css` (real
  names are `--font-size-*`), so those sizes silently inherit. Carried verbatim
  during the task-020 reader extraction to keep `/blog/:slug/read` byte-identical;
  correct it here.
- **The motion vocabulary** — v2 spec §15's bands, currently tuned mechanically
  per-slice and never given a coherent pass:

  | Moment | Band |
  |---|---|
  | arm / long-press | ~150–250 ms, ease-out-quint |
  | parked snap-to-edge | ~200–300 ms, ease-out-expo |
  | dissolve / fall-on-dismiss | bounded < ~600 ms |
  | dwell-progress | reveals only after ~120 ms |
  | hero morph | ~300–450 ms |

- **Both themes**, with the contrast floor (≥4.5:1 for prose in the box, v2 spec
  §6) evaluated **per theme, not once** — the spec is explicit that translucency
  was rejected precisely because it could not guarantee this.
- **Mobile viewports.** The capstone runs over the mobile-complete whole; the
  design covers 390 px as a first-class case, not an afterthought.
- **The static-fallback look** — the PNG/gradient path the ~18% without WebGPU
  actually see (ADR-0009). **Designed, not residual.**
- **Background-scene curation** — which of the existing scenes ship, and their
  fallback PNGs. *Authoring new scenes is DRAFT-003 and is deferred*; this is a
  curation decision, not a shader pass.

### Does not own

The spec §16 art-direction follow-ups, deliberately split out of task-030 on
2026-06-19 into DRAFT-002 (card shaders), DRAFT-003 (background shaders) and
DRAFT-004 (wide media). All three are DEFERRED. **Do not let them creep back in
under "polish"** — that split is what gives the capstone a finite surface.

### Parked-card feel

task-030's standing note says to coordinate with DRAFT-006. **WP-01 first
adjudicates whether DRAFT-006's premise even survives drift** — it complains of a
card that "hangs and swings as a live physics pendulum off the box", but ADR-0010
set engine gravity to `{0,0}` on every route. Style the *actual* parked pose,
whatever the sweep found; do not polish a dangle that no longer exists.

### Constraint that keeps it safe

The spine was built token-separable specifically so this pass is a **reskin, not a
rewrite** (v2 spec §15). TASK-030 AC#2 holds it there — styling and tokens only,
spine tests green. A capstone that starts changing behaviour has left its lane, and
the register has no room for that.

**Skills:** `impeccable` and `frontend-design` are the named tools (CLAUDE.md's
design-sequencing rule points at both).

**Verification:** side-by-side of every route before/after, desktop **and** mobile
**and** reduced-motion **and** the no-WebGPU fallback; full verify gate;
`git diff --stat main...HEAD` concentrated in `.css` and token files with any
`.tsx` change justified in the handoff; measured contrast in both themes.

**Protect-last discipline (A23):** nothing else may borrow WP-11's hours. CUT-9
trims its edges only after everything else has fired, and escalates rather than
cuts its core. **Chai's eye is the acceptance instrument** — screenshots are the
evidence trail, sign-off is human.

---

## The one thing this stream cannot resolve

**T3 — delight vs triage.** A5 makes "visitors admire the site itself" a launch
goal; A19 then moved every delight-bearing item except the capstone to NICE, and
**CUT-1 removes TASK-039**, the last visual-fidelity item beside it. In the
budgeted path, this stream carries the entire delight budget alone.

That may be exactly right, or A19's rule may have over-fired. **Only Chai can say
(O3).** The decision point is the 2026-08-30 checkpoint — early enough that a
restored item can ride M3 rather than needing its own slot.

**If one item is restored, restore DRAFT-007 (hero-morph polish):** 4–8 h, pure CSS
in head-loaded `base.css`, improving the single most-seen transition on the site,
and it folds into the capstone's motion-vocabulary work rather than competing with
it. Full reasoning in [`open-questions.md`](open-questions.md) §T3.
