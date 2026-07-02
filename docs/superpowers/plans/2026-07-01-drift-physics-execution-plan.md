# Drift Physics Execution Plan (thin layer over the ratified spec)

Tracked by: task-042

> **For agentic workers:** This plan is a THIN EXECUTION LAYER over
> `docs/superpowers/specs/2026-07-01-drift-physics-design.md` (RATIFIED 2026-07-01;
> decisions D1–D10 are FROZEN — do not reopen them). For all design content — force
> model, change map, mechanisms, line references — read the cited spec sections; this
> plan deliberately restates none of it. Execute slice-by-slice via
> superpowers:executing-plans or subagent-driven development; each slice becomes its own
> backlog sub-task (decomposition needs its own explicit go — see "Decomposition
> protocol" below).

**Goal:** Land the gravity → top-down drift physics rewrite (spec §0–§3) in four
independently-shippable slices, each passing the full verify gate.

**Architecture:** Per spec §2 D1–D10 and ADR-0010. Not restated here.

**Tech stack:** Existing pins only (matter.js retained per D6; toolchain pins per
`docs/process/toolchain-pins.md`).

## Global constraints (apply to every slice)

- **Frozen decisions:** spec §2 D1–D10 + the §3 change map. A slice that deviates stops
  and escalates; it does not redesign.
- **Out of scope** (spec §5 + §6): feel constant *values* (S4 tunes them in-session,
  never designs them), home composition, melt dismissal, Atelier drift axis, persisted
  pins, pointer forces.
- **Verify gate per slice:** typecheck + test + build (prerender check) + smoke +
  secret-scan — exact commands in `docs/process/local-verification.md`. Clean output,
  not just exit 0.
- **Grep sweep per slice** (spec §3.8 declares its test list non-exhaustive): end every
  slice with `grep -rE "gravity|falling|spawnOffset" web/src --include='*.test.*'` and
  triage every hit.
- **Git flow:** git-flow-squash. Branch `<type>/task-NNN-<slug>` off fresh `main`;
  local diff review; squash-merge on explicit approval only. Umbrella task-042 stays
  In Progress until all four slices merge and Chai signs off.
- **Docs:** CONTEXT.md / ADR-0010 / PRD roster already updated (commit e3f5181, D9/D10
  executed). Slices update docs only if implementation surfaces *new* domain language.
- **Executing sessions have no other context.** Every sub-task AC below carries a spec
  pointer; read those sections before writing code.

## Slice sequence

Derived from spec §7 (explicitly non-approved input — two boundary adjustments below,
with justification). Order is dependency-driven: S1 makes drift real engine-wide, S2
converts the ladder's behaviors, S3 converts rendering and deletes the dead weight, S4
converts route authorship and tunes feel. **Deletion ordering rule honored:** nothing is
deleted before its replacement lands (adjustment 1 exists precisely to keep that true).

| # | Slice | Branch (sub-task ids minted 2026-07-02) | Size |
|---|---|---|---|
| S1 | Engine + mode plumbing | `feat/task-042.01-drift-engine` | L |
| S2 | Ladder conversion + spawn swap | `feat/task-042.02-drift-ladder` | M |
| S3 | Rendering + cleanup | `feat/task-042.03-drift-rendering-cleanup` | M |
| S4 | Route conversion + feel pass (SOLO — never a wave) | `feat/task-042.04-drift-routes-feel` | M |

### Boundary adjustments vs the §7 sketch (justified)

1. **§3.5 spawn moves whole into S2** (§7 had `[new]` drift spawn in slice 2 but the
   `[delete]` sweep in slice 3). Replacement and deletion must land together: the moment
   S2 rewires `CardImpl.tsx`'s spawn computation (spec §3.5), the spawnOffset
   import/prop chain goes unused, and `web/tsconfig.json` has `noUnusedLocals` +
   `noUnusedParameters: true` [reuse — verified this session], so a split leaves S2
   either red on typecheck or littered with suppressions. §7 is non-approved input;
   this is sequencing, not design.
2. **`parkAt`'s inline radial-wiring duplicate (spec §3.3) converts in S1**, alongside
   `wireTetherFor`, not with the rest of the pin work in S2. §3.3 defines ONE radial
   rule replacing both call sites; splitting them across slices would ship a build where
   authored ropes and parked ropes wire edge attachments with two disagreeing formulas.
   Coverage note (CORRECTED by this plan's adversarial review): `PinnedCard.test.tsx`
   :282-315 exercises the parkAt path via real auto-park but asserts only wobble
   neutrality — no attach point or rope length; `PhysicsWorld.contentBox.test.ts` does
   NOT exercise parkAt at all (its :123 "Mirrors PinnedCard.parkAt" is a comment on a
   hand-copied inline duplicate of the old y-projection, and the file is itself on S1's
   rewrite list). The actual gate for this adjustment is S1 AC10's NEW radial-wiring
   tests at both call sites, not existing coverage.

### Interim-state safety (why S1 can flip the site to drift before S2/S3 land)

S1 makes `mode` absent ⇒ `'drift'` (spec §3.2), so the whole site drifts while some
gravity-era consumers persist until S2/S3. Verified safe this session [reuse]:
`StringLayer.tsx:29-31` and `card/spawnOffset.ts:6-8` both fall back to a downward unit
vector at gravity `{0,0}` — no NaN, no crash; slack strings sag downward and spawns
offset downward until S3/S2 convert them. Cosmetic-only interim, and every slice still
passes its own full gate. Pin poses are similarly gravity-tuned-but-functional until S2.

---

## S1 — Engine + mode plumbing (size L)

**Scope (pointers, not prose):** spec §1 (full force model incl. damping registration
mechanics), §3.1 (all four `[extend]`/`[new]` entries), §3.2 (everything EXCEPT the
route-file `gravity:` drops, which are S4), §3.3's radial edge wiring only (both call
sites, per adjustment 2), D7's `driftTuning.ts`.

**Files** (from the spec's own line-referenced map — see cited §§ for what changes):
- Modify: `web/src/physics/PhysicsWorld.ts`, `web/src/physics/Tether.ts`,
  `web/src/pin/PinnedCard.tsx` (parkAt only), `web/src/physics/PageSpec.ts`,
  `web/src/routes/routeLayout.ts`, `web/src/atelier/schemas/layout.ts`,
  `web/src/atelier/vite-plugin-atelier.ts` (gravity-emission half),
  `web/src/physics/usePageDef.ts` (possibly `web/src/card/CardImpl.tsx` :252-258 if the
  drift anchor-move policy routes caller-side rather than inside `setAnchor` — spec
  §3.1/D4 frames it world-side; builder decides)
- Create: `web/src/physics/driftTuning.ts` (read-at-use; fields per D7 semantics —
  suggested names `baseAmplitude`, `damping`, `repelRadius`, `repelStrength`; NOT in
  `physicsTuning.ts`, per D7's Atelier-regen gotcha)

**Interfaces produced (later slices rely on):**
- `PageSpec.mode?: 'drift' | 'gravity'` (absent ⇒ `'drift'`), `PageSpec.driftScale?:
  number`, `PageSpec.gravity` optional — exact semantics spec §3.2. S4 authors values.
- `driftTuning` module — S4 tunes its values.
- Radial edge-wiring rule in `wireTetherFor` — S2's park poses consume it.

**Spec §3.8 test items landing here:**
- Rewrites: `PhysicsWorld.test.ts` (dormant-mode shrink), `PhysicsWorld.contentBox.test.ts`,
  `PhysicsWorld.wordAnchor.test.ts`, `usePageDef.test.tsx`, `routeLayout.test.ts`,
  `layoutOverride.test.tsx`, `vite-plugin-atelier.test.ts` (gravity-emission half),
  `CardImpl.test.tsx` ceiling/floor wiring cases, `Tether.test.ts` radial-edge cases.
- `[new]`: drift force pass frozen-body determinism (injected RNG), dt-invariance of
  Brownian statistics, mass-invariance, prose-repel falloff (corners + inside-rect),
  radial edge wiring, drift-settle bounded-drift invariant, drift-mode anchor-move
  translate-pair.

**Named verification checks:**
- V1.1 full verify gate (`docs/process/local-verification.md`).
- V1.2 dormant-path fidelity: `mode:'gravity'` test route behaves per the dormant
  subset (frictionAir 0.005, setAnchor teleport, four cardinals) — spec §3.1's
  bit-identity requirement.
- V1.3 invariance suite green: dt (8ms vs 33ms), mass, injected-RNG determinism (§1).
- V1.4 Atelier arrange-mode write-back round-trip on a gravity-less `.layout.ts` — regen
  neither re-inserts nor rejects (the §3.2 HIGH finding).
- V1.5 smoke: `/`, one blog post (pin a card, park + recall), `/test/box` — cards drift,
  drag works, zero console/errors output.
- V1.6 grep sweep (global constraint).

**Draft sub-task ACs (Done-gates for the future sub-task):**
1. Read spec §§1, 3.1, 3.2, 3.3 (radial rule), D7 before starting — the executing
   session has no other context.
2. With no `mode` declared, every route runs drift: engine gravity `{x:0,y:0}` + drift
   force pass active (unit + smoke evidence). [spec §3.1, §3.2]
3. Invariance tests green: dt-normalized, mass-invariant, deterministic under injected
   RNG; plus the drift-settle bounded-drift invariant test. [spec §1, §3.8]
4. A route-declared `driftScale` scales wander amplitude (test); default 1 when absent —
   the plumbing must reach the §1 apply site. [spec §1, §3.2]
5. Damping, BOTH halves: bodies register `frictionAir = driftTuning.damping` under
   drift and `BODY_FRICTION_AIR` under `mode:'gravity'`; the drift tick re-syncs
   `body.frictionAir` from `driftTuning` (test evidence). [spec §1 damping row, §3.1]
6. Prose-repel falloff finite + outward everywhere incl. corners and inside-rect (test).
   [spec §1, §3.8]
7. Dormant gravity subset green under `mode:'gravity'` (V1.2). [spec §3.1]
8. Word-anchor proxies register as sensors; no collision impulse from proxy overlap
   (test). [spec §3.1]
9. Drift-mode anchor moves translate-pair (wander offset + velocity preserved), never
   teleport-and-zero (test). [spec §3.1, D4]
10. Radial edge wiring at BOTH call sites: `wireTetherFor` cases in `Tether.test.ts`
    AND a parkAt-level test driving `PinnedCard` through auto-park, asserting attach
    point + radial length (the `wireTetherFor` cases do NOT cover `parkAt`'s inline
    duplicate). [spec §3.3, §3.8]
11. Atelier layout write-back round-trips gravity-less layouts (V1.4). [spec §3.2]
12. Full verify gate + grep sweep clean (V1.1, V1.6).

**Risks:** site-wide drift flips ON here — interim cosmetics until S2–S4 (see
Interim-state safety); the §3.2 zod/regen chain is the widest blast radius (HIGH
review finding — V1.4 is its gate); missed `registerAnchor` sensor-ization would
reproduce an i111-class invisible kick.

**Spec claims this slice load-bears on** (listed for the plan's adversarial review to
re-verify; NOT re-verified here): all §3.1 line refs (`PhysicsWorld.ts` :66, :79, :95,
:103-157, :215-230, :239-247, :304, :313-331, :434-437, :516-523, :613); `Tether.ts`
:32-54, :52, :197, :202-215; `PhysicsContext.tsx` :79-91, :84; `PageSpec.ts` :58, :64-66;
`routeLayout.ts` :25, :36; `schemas/layout.ts` :89-97, :147, :192;
`vite-plugin-atelier.ts` :422, :461, :498; `usePageDef.ts` :7-14; `PinnedCard.tsx`
:197-201; matter sleeping not enabled anywhere in `web/src`.

---

## S2 — Ladder conversion + spawn swap (size M)

**Scope:** spec §3.3 (poses + `parkGapPx`; radial wiring already landed in S1), §3.4
(all of it), §3.5 (all of it, per adjustment 1).

**Files:**
- Modify: `web/src/pin/PinnedCard.tsx` (poses/fallback), `web/src/pin/ambientPins.ts`,
  `web/src/routes/Home.tsx` (ambient offset only — its `gravity:` drop is S4),
  `web/src/pin/pinTuning.ts` (`parkGapPx` reinterpretation), `web/src/peek/fling.ts`,
  `web/src/peek/PreviewCard.tsx`, `web/src/peek/PeekStore.ts`,
  `web/src/peek/peekTuning.ts` (renames per D7), `web/src/card/CardImpl.tsx` (spawn)
- Delete (the §3.5 10-file sweep — module + test + field + plumbing): `web/src/card/
  spawnOffset.ts` + its test, `CardSpec.spawnOffset` (`PageSpec.ts`), prop plumbing in
  `Card.tsx` / `CardRegistry.tsx` / `Page.tsx`, `physicsTuning.spawnOffsetPx`, Atelier
  schema field + binding (`schemas/physics.ts`), `vite-plugin-atelier.ts` entry

**Interfaces:** consumes S1's radial rule + repel force (§1: poses = rope + repel
jointly). Produces the `'dismissing'` phase name and re-semanticized `peekTuning` knobs
(`fadeMs`, `dismissKick`) that S4 tunes.

**Spec §3.8 test items landing here:** rewrites `fling.test.ts`, `PeekStore.test.ts`
(phase string), `PeekTriggers.test.tsx` (:229 also asserts `'falling'` — omission
inherited from §3.8, verified in-session), `ambientPins.test.ts`; deletes `spawnOffset` test; keeps
`scrollRegime.test.ts`, `pin/wordAnchor.test.ts`, `recursion.test.ts`, `CardImpl.test.tsx`
drag/fling untouched.

**Named verification checks:**
- V2.1 full verify gate.
- V2.2 dismissal smoke: dwell-peek a Portal, dismiss → random-direction fling + fade,
  body removed on fade-end (not viewport exit); repeat for a Pocket.
- V2.3 pin-pose smoke: keep a card → word-anchored floats just clear of prose; scroll
  past fold → auto-parks at edge; recall works. (Poses functional; *polish* is S4.)
- V2.4 ambient pins on `/` seed near-word, any-direction offsets.
- V2.5 grep sweep — `falling` and `spawnOffset` must be zero-hit after this slice.

**Draft sub-task ACs:**
1. Read spec §§1, 3.3, 3.4, 3.5 before starting — no other context.
2. Dismissal = slight random fling + fade-out, removal on fade-end;
   viewport-clearance detection (`CLEAR_PAD`) deleted. [spec §3.4]
3. `PeekStore` phase renamed `'dismissing'`; zero `'falling'` hits in src + tests.
   [spec §3.4, §3.8]
4. Cards spawn at layout anchor with small random velocity; the full §3.5 10-file
   spawnOffset sweep is deleted in this same slice. [spec §3.5]
5. Parked + word-anchored poses produced by rope + repel jointly (V2.3 smoke evidence).
   [spec §1, §3.3]
6. Ambient-pin default offset (`ambientPins.ts`) and root-pin fallback (`PinnedCard.tsx`
   :127-131) converted to authored near-word, any-direction offsets
   (`ambientPins.test.ts` rewritten; V2.4 evidence); `pinTuning.parkGapPx` reinterpreted
   as park-rope rest clearance. [spec §3.3]
7. `peekTuning` knobs re-semanticized in place (`fadeMs`, `dismissKick`); dismissal
   knobs live ONLY in `peekTuning`. [spec D7]
8. Full verify gate + grep sweep clean (V2.1, V2.5).

**Risks:** pose quality depends on S1's repel constants being at least sane (S4 owns
tuning — S2 only proves the mechanism); unequal-mass tethered pairs (child pins) may
expose the §1 rope self-propulsion conditional — if observed, that's spec open item 7's
symmetrize-at-build, in-scope for this slice, not a redesign.

**Spec claims this slice load-bears on:** `fling.ts` consumers = `PreviewCard.tsx` +
test only; `PreviewCard.tsx` :224-230; `PeekStore.ts` :13 (+ test :28,:40,:44); the
§3.5 10-file list (incl. `CardImpl.tsx` :10, :59-65); `PinnedCard.tsx` :129, :155;
`ambientPins.ts` :47; `Home.tsx` :36; `pinTuning.parkGapPx` existence.

---

## S3 — Rendering + cleanup (size M)

**Scope:** spec §3.6 (both entries), §3.7 (all of it, including the layout-axis gravity
select it points at via §3.2 — concretely `LayoutAxis.tsx`, a file the spec's change
list omits; review-added, see Files), §3.8's `sectionLayout` deletion, D1's demo
deletions (`routes/sandbox/Strings.tsx` + registration + the `App.tsx:241` stale
comment), the `FrameBar.test.tsx:182` stale-name fix.

**Files:**
- Modify: `web/src/canvas/StringLayer.tsx` (+ its test), `web/src/physics/Tether.ts`
  (`list()` tension) + `Tether.test.ts`, `web/src/physics/physicsTuning.ts`,
  `web/src/atelier/schemas/physics.ts`, `web/src/atelier/vite-plugin-atelier.ts` (+ its
  test, fossil half), `web/src/atelier/PhysicsAxis.tsx` (world-group demotion +
  re-scatter label), `web/src/atelier/LayoutAxis.tsx` (:211-228 hardcoded Gravity
  select → render/write only when the layout carries gravity; review finding: the
  select's onChange writes a `gravity` key into working values, so post-S4 the UI path
  would re-insert gravity into a gravity-less `.layout.ts` — the §3.2 HIGH failure
  resurfacing above the schema layer V1.4 gates), `web/src/App.tsx` (route dereg +
  :241 comment), `web/src/canvas/FrameBar.test.tsx` (:182 name)
- Delete: `web/src/routes/sandbox/Strings.tsx` (NOT `web/src/sandbox/` — that is an
  unrelated, live directory of v1 card/particle experiments; do not touch it),
  `web/src/layout/sectionLayout.ts` + its test
  (after the §3.8-mandated verify-at-build that no planned consumer exists)

**Interfaces produced:** `TetherView.tension` (continuous; pin the exact formula per
§3.6's recommendation and state the `slackFactor`-boundary behavior + the per-call
allocation note) — **this is task-039's API**; the tension test is its contract.

**Spec §3.8 test items landing here:** `Tether.test.ts` `[extend]` continuous-tension
cases (slack ⇒ 0/clamped, monotonic past rest, `slackFactor` boundary);
`StringLayer.test.tsx` mode-gated sag/straight+styling (per §3.6's `[extend]` — the
§3.8 list, declared non-exhaustive, does not name it); `vite-plugin-atelier.test.ts`
fossil half (write-back round-trip stays green); `sectionLayout.test.ts` `[delete]`;
`FrameBar.test.tsx:182` rename.

**Named verification checks:**
- V3.1 full verify gate. Note (review-corrected): the prerender set does NOT change —
  `/sandbox/strings` was never prerendered (`web/vite.config.ts` `includedRoutes`
  filters `/sandbox/*` except `/sandbox/scenes/*`; `dist/sandbox/` holds only
  `scenes/` today). The deletion removes a client route-table entry + a lazy chunk.
  Verify: no new/removed route dirs in `dist/`, and `/sandbox/strings` 404s in smoke.
- V3.2 tension contract tests green with the formula pinned in code comment/test names
  (task-039 reads this).
- V3.3 StringLayer smoke on a drift route: straight lines, stroke/opacity varies
  slack→taut (drag a tethered card taut); dormant sag branch still covered by test.
- V3.4 Atelier write-back round-trip test green post-fossil-sweep; `/atelier` physics
  axis smoke: world group presents as dormant-mode, "re-scatter" label; layout-axis
  UI-path check: on a gravity-less layout, open the layout axis, touch a field, write
  back — the regenerated `.layout.ts` must NOT gain a `gravity:` line.
- V3.5 grep `sectionLayout|partitionChain|partitionPageDef|spawnOffset` in `web/src` —
  zero hits; `gravity` sweep triaged.

**Draft sub-task ACs:**
1. Read spec §§3.6, 3.7, 3.8 (deletions), D1 before starting — no other context.
2. Drift routes render straight tether lines with slack/taut → stroke width + opacity;
   the sag branch is mode-gated, not deleted, and stays test-covered. [spec §3.6]
3. `TetherView` exposes continuous `tension` with the exact formula pinned in
   `Tether.test.ts` case names + a code comment at `list()`, boundary behavior stated;
   the formula + per-call-allocation note appended onto **task-039's board entry** via
   `--append-notes` (naming this sub-task + spec §3.6) before Done — a note only in
   spec/code does not satisfy this. [spec §3.6, §3.8; backlog-core propagation rule]
4. The 9 fossil constants are gone via the 4-file sweep; write-back round-trip test
   green. [spec §3.7]
5. `sectionLayout.ts` + test deleted after verifying zero non-test importers at build
   time. [spec §3.8]
6. `routes/sandbox/Strings.tsx` + its `App.tsx` registration deleted; client route
   table + lazy chunk removed; prerender set UNCHANGED (never prerendered — V3.1 note;
   spec D1's "prerender set shrinks" wording is escalated, see Escalations);
   `/sandbox/strings` 404s in smoke; `App.tsx:241` stale comment removed. [spec D1]
7. Atelier world group demoted to dormant-mode presentation; "Re-drop" → "re-scatter";
   `LayoutAxis.tsx` gravity select renders/writes only for gravity-carrying layouts
   (V3.4 UI-path check). [spec §3.7]
8. Full verify gate + sweeps clean (V3.1, V3.5).

**Risks:** the tension formula is a downstream contract (task-039) — changing it later
is a breaking change, hence V3.2's pin-it-in-tests; fossil sweep touches the Atelier
plugin's zod schema, same regen blast radius class as §3.2 (round-trip test is the gate).

**Spec claims this slice load-bears on:** `StringLayer.tsx` :27-52; `Tether.ts` :60,
:156-175; fossils have zero runtime consumers + the 4-file sweep list;
`partitionChain`/`partitionPageDef` zero non-test importers; `App.tsx` :183-188, :241;
`schemas/physics.ts` :21-28; `redropKey.ts` / `PhysicsAxis.tsx` :38 remount mechanism;
`FrameBar.test.tsx` :182.

---

## S4 — Route conversion + feel pass (size M — SOLO, in-session)

**Scope:** spec §3.2's route-file `gravity:` drops, D7's per-route `driftScale`
authoring, D8 (reduced-motion wiring + the pin-gate non-change), spec §6 build-time
items 1–4 (feel constants, chain scenography, pose polish + wobble retune, Box/BoxB
demo polish + walkthrough copy).

**Files:**
- Modify — the **8 `gravity:` declarations across 7 files** (paths verified by src
  grep; the spec's "Lifelog/Stuff.layout.ts" is shorthand for two files, and Flash.tsx
  carries two declarations): `web/src/routes/Home.tsx` (:20),
  `web/src/routes/NotFound.tsx` (:10), `web/src/routes/Lifelog.layout.ts` (:5),
  `web/src/routes/Stuff.layout.ts` (:5), `web/src/routes/stuff/Flash.tsx` (:114, :124),
  `web/src/routes/stuff/FlashDetail.tsx` (:70), `web/src/routes/test/Box.tsx` (:39);
  plus `web/src/routes/test/BoxB.tsx` walkthrough copy, `web/src/pin/pinTuning.ts`
  wobble* retune values (:22-30 — NOT `wobble.ts`, which is a pure stepper with
  injected config and no tunables), `driftTuning.ts` + `peekTuning.ts` + per-route
  `driftScale` values (tuning only), reduced-motion wiring site (per D8)
- Tests: rewrite `Home.test.tsx` (:21-22), `NotFound.test.tsx` (:59-60),
  `Flash.test.tsx` (:54)

**Interfaces:** consumes everything; produces the shipped feel. Nothing downstream
consumes S4's values programmatically.

**Spec §3.8 test items landing here:** `Home.test.tsx`, `NotFound.test.tsx`,
`Flash.test.tsx` (the `pageDef.gravity` assertions). Final global grep sweep.

**Named verification checks:**
- V4.1 full verify gate.
- V4.2 route-by-route smoke of EVERY route (the full SSG set): renders, drifts at its
  authored intensity, no console/errors output.
- V4.3 reduced-motion emulation: `driftScale = 0` — cards still; drag + peek work; pin
  freeze/park/recall behavior unchanged from ADR-0008's gate.
- V4.4 chain-route scenography: `/stuff/flash` + detail feel-checked with `trail` intact.
- V4.5 feel session: Chai-in-the-loop tuning of amplitude/damping/repel/driftScale +
  wobble; reading routes near-still (prose readable while drifting).
- V4.6 route-declaration sweep: `grep -rn "gravity:" web/src/routes` — remaining hits
  only in `routeLayout.ts` (the optional type + mapping); zero route-file declarations.
  (The global test-only grep sweep does not cover route files — a leftover `gravity:`
  is inert under drift and green on every gate, hence this named src-level check.)

**Draft sub-task ACs:**
1. Read spec §§3.2 (route drops), D7, D8, §6 items 1–4 before starting — no other
   context.
2. All 8 route-file `gravity:` declarations (7 files) dropped — V4.6 src-grep
   evidence; route tests rewritten; zero `pageDef.gravity` assertions remain for drift
   routes. [spec §3.2, §3.8]
3. Per-route `driftScale` authored route-side (never in `.layout.ts`): reading routes
   near-still, canvas routes livelier — evidenced in V4.2 smoke. [spec D7]
4. `prefers-reduced-motion` ⇒ `driftScale = 0`; drag and peek still work; existing
   reduced-motion pin behavior unchanged. [spec D8]
5. Box/BoxB converted and serving as the ladder + nested-cards demo with accurate
   walkthrough copy. [spec §6 item 4, D1]
6. Chain routes' drift feel + `trail` scenography checked. [spec §6 item 2]
7. Word-anchored/parked pose polish + wobble retuned for drift (`pinTuning.ts` wobble*
   values), feel-checked in the V4.5 session. [spec §3.3, §6 item 3]
8. **Feel constants tuned solo in-session (visual/feel AC — never run as a background
   wave).** [spec §6 item 1]
9. Full verify gate + V4.6 route-declaration sweep + final global grep sweep clean.

**Risks:** feel tuning can mask mechanism bugs (if a pose only works at one magic
constant, that's an S2 mechanism defect — reopen the slice, don't tune around it);
`frictionAir` damping values must respect the NaN-inversion margin noted in spec §1.

**Spec claims this slice load-bears on:** the six route-file gravity declaration line
refs (§3.2); `wobble.ts` :36-40 velocity-driven / `PinnedCard.tsx` :323-334 drive;
ADR-0008 sim-gate at `PinnedCard.tsx` :155; `CardSpec.trail` at `PageSpec.ts` :34.

---

## Traceability matrix — every §3 `[extend]`/`[new]`/`[delete]` → exactly one slice

| Spec entry | Tag | Slice |
|---|---|---|
| §3.1 drift force pass in tick (Brownian + prose repel) | new | S1 |
| §3.1/§1 damping mode-conditional registration + drift-tick re-sync | extend | S1 |
| §3.1 word-anchor proxies → sensors | extend | S1 |
| §3.1 drift-mode anchor-move translate-pair policy | new | S1 |
| §3.2 `PageSpec.gravity` → optional | extend | S1 |
| §3.2 `PageSpec.mode` | new | S1 |
| §3.2 `PageSpec.driftScale` (field + plumbing; values authored in S4) | new | S1 |
| §3.2 `RouteLayout.gravity` optional + `pageSpecFromLayout` | extend | S1 |
| §3.2 `schemas/layout.ts` seed/write/read gravity-when-present | extend | S1 |
| §3.2 `vite-plugin-atelier` zod optional + regen emit-when-present | extend | S1 |
| §3.2 route files drop `gravity:` declarations | extend | S4 |
| §3.2 `usePageDef` sets mode (+ gravity when declared) | extend | S1 |
| §3.3 radial edge wiring (`wireTetherFor` + `parkAt` duplicate) | extend | S1 |
| §3.3 parked/word poses + root-pin fallback + ambient offsets | extend | S2 |
| §3.3 `pinTuning.parkGapPx` reinterpretation | extend | S2 |
| §3.3 word-wobble retune (the retune half of reuse-and-retune) | extend | S4 |
| §3.4 dismissal → random fling + fade, removal on fade-end | extend | S2 |
| §3.4 `CLEAR_PAD` viewport-clearance detection | delete | S2 |
| §3.4 `peekTuning` renames (`fadeMs`, `dismissKick`) | extend | S2 |
| §3.4 `PeekStore` phase `'falling'` → `'dismissing'` | extend | S2 |
| §3.5 spawnOffset 10-file sweep | delete | S2 (adjustment 1) |
| §3.5 drift spawn (anchor + small random velocity) | new | S2 |
| §3.6 StringLayer mode-gated sag; drift straight + tension styling | extend | S3 |
| §3.6 `TetherView` continuous tension in `list()` | extend | S3 |
| §3.7 9 fossil constants (4-file sweep) | delete | S3 |
| §3.7 Atelier world group → dormant-mode presentation | extend | S3 |
| §3.7 "Re-drop" → "re-scatter" | extend | S3 |
| §3.8 `sectionLayout.ts` module + test | delete | S3 |
| §3.8 `Tether.test.ts` extension — the continuous-tension cases (S1's radial-edge coverage arrives via the separate §3.8 `[new]` radial-edge-wiring test item, mapped with S1's test list) | extend | S3 |
| §3.7→§3.2 layout-axis gravity select (`LayoutAxis.tsx` — render/write only when the layout carries gravity; review-added: the spec names the select but its change list omits the file) | extend | S3 |
| D7 `physics/driftTuning.ts` | new | S1 |
| D8 reduced-motion wiring (`prefers-reduced-motion` ⇒ `driftScale = 0`; pin gate unchanged) | new | S4 |
| D1 `routes/sandbox/Strings.tsx` + `App.tsx` registration + :241 comment | delete | S3 |

(§3 `[reuse]` entries are intentionally unmapped — no work to schedule. D9/D10 docs
entries already executed in e3f5181.)

## Decomposition protocol (later step, separate go)

Four sub-tasks (one per slice) under umbrella task-042, created main-session-only after
explicit approval of this plan. Each gets: the slice's Draft ACs verbatim (via `--ac`),
`claude-generated` label, v2 milestone, HIGH priority, and `--append-notes` pointing at
this plan + the spec. S1–S3 may run as normal solo tasks; S4 is solo-in-session by AC.
Slices merge serially (each branches off the previous merge); no wave.

Downstream propagation (backlog-core rule — pointers land on the CONSUMER's task, not
only in docs): S3's sub-task appends the pinned tension formula + allocation note onto
**task-039** via `--append-notes` before its Done (S3 AC3); at umbrella task-042
closure, append gate-lift notes onto **task-038** and **task-041**.

## Claims introduced by this plan itself (not in the spec)

| Claim | Tag | Verification |
|---|---|---|
| `web/tsconfig.json` has `noUnusedLocals` + `noUnusedParameters: true` (drives adjustment 1) | [reuse] | verified this session (grep) |
| `StringLayer.tsx:29-31` falls back to downward unit vector at g={0,0} — no NaN interim | [reuse] | verified this session (read) |
| `card/spawnOffset.ts:6-8` same zero-g fallback — no NaN interim | [reuse] | verified this session (read) |
| `parkAt` coverage claim — CORRECTED by the adversarial review: `PinnedCard.test.tsx` exercises the path (real auto-park) but asserts no wiring geometry; `PhysicsWorld.contentBox.test.ts` never calls parkAt (comment-marked hand-copy of the old formula, itself on S1's rewrite list). Adjustment 2's real gate is S1 AC10's new tests. | [reuse → corrected] | review wf_15f73cfa: 3 independent confirmations (a grep hit on a comment had been counted as coverage) |
| `driftTuning` field names (`baseAmplitude`, `damping`, `repelRadius`, `repelStrength`) | [new] | naming only; semantics are D7's — builder may rename |

All other repo claims in this plan are the spec's own (each slice lists the ones it
load-bears on); the plan's adversarial review re-verifies those — deliberately not
re-verified here.

## Escalations

1. **Spec D1 wording error (for Chai — the spec is frozen and has NOT been edited):**
   D1 states deleting the Strings demo means "the SSG prerender set shrinks
   accordingly" (marked ✓r by the 46-agent spec review). False: `web/vite.config.ts`
   `includedRoutes` already filters `/sandbox/*` (except `/sandbox/scenes/*`) out of
   prerender, and `dist/sandbox/` contains only `scenes/` today — `/sandbox/strings`
   was never prerendered. The deletion removes a client route-table entry + lazy chunk;
   the prerender set is unchanged. The delete DECISION is unaffected; only the stated
   observable is wrong. This plan's S3 AC6/V3.1 carry the corrected observable; amend
   the spec sentence at its next touch.

No design error found in D1–D10's decisions or the §3 change map beyond the wording
above. The two §7 sequencing adjustments are boundary changes to explicitly
non-approved input, with stated justification — not re-litigation.
