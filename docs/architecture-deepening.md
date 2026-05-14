# Architecture deepening — candidate list for grilling

**Status:** Draft. None of these are committed; this is raw material for the
`/improve-codebase-architecture` skill's grilling loop.
**Created:** 2026-05-12, merged 2026-05-13.
**Scope:** `web/src/` primarily; `api/src/` is largely empty so backend
candidates from the PRD ("LastFmAdapter", "CacheLayer", etc.) are intentionally
out of scope until those modules exist.

This is **not** a plan, ADR, or backlog. Every "Direction" line is a starting
point to interrogate, not a recommendation. Side effects of grilling — adding
domain terms to a future `CONTEXT.md`, recording ADRs — happen *inside* the
grilling session, not here.

---

## How to resume

1. Read `docs/adr/0001-gravity-and-strings.md` (the only ADR — cards / physics
   / strings). Several candidates touch its decisions; some don't.
2. Re-read this file end-to-end.
3. Pick a candidate from the list below. Suggested order at the end of the file.
4. Drop into the skill's grilling loop — it walks the design tree once told
   which candidate to focus on.
5. **`CONTEXT.md` exists** (created during the Candidate 7 grill, 2026-05-13;
   grown by each subsequent session). New domain terms and resolved
   ambiguities land in it inline as grilling produces them.

## Progress snapshot (2026-05-14)

Every candidate has had its grill outcome by this point. Status one-liners
live in the `**Status:**` header at the top of each candidate. Summary:

- **Candidates 2, 3, 4, 5, 6, 7, 8, 9** — resolved or shipped.
- **Candidate 1** — partial. Tether extracted; BalloonForces and MatterEngine
  deliberately not extracted (grill resolved against further sub-modules).
- **Candidate 10** — grilled 2026-05-14. Path A locked: extract pure
  helpers (`computeSpawnOffset`, `computeFlingImpulse`), move
  `resolveParent` to `physics/Tether.ts`. No new module, no new seam.
  Slice not yet filed.

Per-candidate sections retain their full original text (Problem, Direction,
Why grill, Linkage, ADR conflict?) so a future explorer can re-derive the
reasoning without re-running git archaeology.

---

## Vocabulary

From `.claude/skills/improve-codebase-architecture/LANGUAGE.md`. Use these
words exactly; don't drift into "component," "service," "API," or "boundary."

- **Module** — anything with an interface and an implementation.
- **Interface** — everything a caller must know to use the module correctly:
  types, invariants, ordering, error modes, required configuration. Not just
  the type-level signature.
- **Implementation** — code inside.
- **Depth** — leverage at the interface. Deep = a lot of behaviour behind a
  small interface. Shallow = interface nearly as complex as implementation.
- **Seam** — where an interface lives. A place behaviour can be altered
  without editing in place. (Not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge
  concentrated in one place.
- **Deletion test** — imagine deleting the module. If complexity vanishes, it
  was a pass-through. If complexity reappears across N callers, it was
  earning its keep.
- **One adapter = hypothetical seam. Two adapters = real seam.** Don't
  introduce a seam unless something actually varies.

---

## Verification status

Spot-checked against the file system on 2026-05-13. Specific facts used below
are verified; LOC counts not personally checked are reproduced from earlier
notes and flagged inline. Treat any number you'd commit to in a grill as
worth re-confirming.

Verified:
- `web/src/physics/PhysicsWorld.ts` — 578 LOC.
- `transitions/primitives/` — 4 primitives (`anchorSlide`, `crossFade`,
  `pourInDrop`, `stringCutDrop`) plus `types.ts`.
- `canvas/scenes/` — 9 scene files plus `manifest.json` + `index.ts`.
- `sandbox/particles/` — 7 tuners plus `TunePanel.tsx`.
- `text/PretextRegistry` consumers — exactly one production caller
  (`routes/blog/BlogIndex.tsx`).
- `createRegistry` consumers — 2 production files (`canvas/useGallery.ts`,
  `canvas/gallery.ts`), 2 call sites; rest are tests.
- Module-level lazy-singleton pattern (`let *Instance: T | null = null`) —
  present in 4 hook files: `useGallery.ts:16`, `useFrameEdge.ts:22`,
  `useMinimizedRegistry.ts:7`, `useTheme.ts:26`. (A 5th case — `text/registry.ts`
  — uses eager module-const instead of lazy-init; same shape concern.)

Corrections to earlier notes:
- The `MinimizedRegistry` module file (`canvas/MinimizedRegistry.ts`) is a
  clean factory — `createMinimizedRegistry()`. The singleton concern lives
  in `useMinimizedRegistry.ts`, not the module file. Same pattern then
  appears in three sibling hooks.

---

## Candidate 1 — `PhysicsWorld`: wide outward seam, no internal seams

**Status: partial. Tether extracted via slice 108 (`0956de4`,
PR [#110](https://github.com/cpalaka/chaipalaka.com/pull/110)). BalloonForces
and MatterEngine deliberately not extracted — the grill's two follow-up
questions resolved against further sub-modules.** See "Resolution" below.

**Files**
- `web/src/physics/PhysicsWorld.ts` (578 LOC, ~35 public entries)
- `web/src/physics/PhysicsWorld.test.ts` (larger than the implementation)

**Problem.** One class coordinates the matter.js engine, body lifecycle,
tether ropes, edge sensors, the per-tick balloon force for `kind:'note'`
cards (per ADR-0001 §8), and event/listener bookkeeping. Caller-visible
knowledge includes lifecycle ordering — when to call `setGravityDirection`
vs spawn bodies vs link tethers. The interface is wide. Tests need the
whole world to exercise any one concern; in practice this means they assert
state, not physics correctness.

**Deletion test.** Deleting `PhysicsWorld` outright would spread matter.js
calls into every caller — so the outward seam *is* earning its keep. But the
**internal** concerns are shallow inside it: tether topology vs gravity
forces vs spatial body management could each be a deep sub-module behind
the same outward seam.

**Direction.** Keep `PhysicsWorld` as the public seam. Internally split into:
- A `Tether` topology module owning the ADR-0001 rope semantics: slack-OK,
  pull-only, `len = distance(parentAnchorPos, cardLayoutPos)`, plus subtree
  enumeration.
- A `BalloonForces` per-tick module (the `kind:'note'` upward force).
- A thin `MatterEngine` adapter at the matter.js boundary.

**Why grill.** Real open questions:
- Is "one outward seam" still right, or should `Tether` be exposed directly
  to callers like `<StringLayer>` so they don't depend on `PhysicsWorld`?
- The balloon-force module is one method. Is it earning its keep, or is it
  inline-able?
- What does `MatterEngine`'s interface look like? If it leaks matter.js
  types, the adapter is shallow.

**Linkage.** Foundational. `Tether` extraction partially solves the
`BodyDriver` interface needed by primitives (Candidate 3) and lets the
minimize subsystem call `subtreeOf(cardId)` (Candidate 4).

**ADR conflict?** No — ADR-0001 specifies behaviour, not module shape.

### Resolution (2026-05-14)

- **Tether extracted** via slice 108. `web/src/physics/Tether.ts` (170 LOC)
  owns rope semantics, the `BodyForceSource` seam, and TetherSpec
  capture/restore. PhysicsWorld shrank from 578 → 425 LOC. Callers reach
  Tether through `world.tether.X` (Candidate 1's grill question "should
  Tether be exposed directly to callers?" — answered "yes, via
  `world.tether`, not as a separate module a caller imports").
- **BalloonForces NOT extracted.** The grill question "is it inline-able?"
  resolved yes. Buoyancy became a per-body property (`Buoyancy` in
  `PageSpec.ts`) and the force is applied inside PhysicsWorld's tick. No
  separate module justified.
- **MatterEngine adapter NOT extracted.** The grill question "what does its
  interface look like? If it leaks matter.js types, the adapter is
  shallow." — resolved against extraction: PhysicsWorld already
  encapsulates matter.js types; a thin MatterEngine layer underneath would
  be redundant.

CONTEXT.md `BodyForceSource` and `Tether` entries are the surviving
artifacts. The cascade-minimize concern that this Candidate cross-referenced
to Candidate 4 dissolved separately (minimize removed via #118).

---

## Candidate 2 — Transitions ↔ PhysicsCard ↔ Registry: contract lives in RAF order

**Status: resolved by slice 111 (state machine — `4acedd2`, `c874918`,
`3c913a9`, `5eb4678`) + Candidate 9 slice (card/ folder extraction).** See
"Resolution" below.

**Files**
- `web/src/transitions/PhysicsCardImpl.tsx` (~355 LOC)
- `web/src/transitions/TransitionDirector.tsx` (~312 LOC)
- `web/src/transitions/CardRegistry.tsx` (~111 LOC)
- `web/src/physics/PhysicsCard.tsx` (declarative registration into `CardRegistry`)
- `web/src/transitions/PhysicsLayer.tsx` (root-level portal that survives route unmount)

**Problem.** These files talk via React context and shared mutable handles.
The *real* contract between them is the RAF sequence — when bodies spawn,
when the reveal flag flips, when primitives advance. That contract is
nowhere named. The director carries prose comments like *"pour-in primitive's
RAF fires before this impl mounts"* — a load-bearing invariant expressed
only in English. Each file has unit tests; the inter-file race conditions
don't.

There's also a folder-boundary symptom: a route author learns the API from
`physics/PhysicsCard.tsx`, but the rendering / portal / lifecycle live in
`transitions/`. The card subsystem's seam is split across two folders with
nothing naming it.

**Deletion test.** Each file is load-bearing. The seam *between* them is
shallow: they read each other's internals freely.

**Direction.** Name the contract. A `TransitionFrame` interface (or
similar) owned by the director, with `PhysicsCardImpl` and primitives as
**adapters** at the seam. "Did the body spawn at the right position before
reveal fired?" becomes a testable interface property, not a comment.

Structurally: promote a `card/` module that owns `PhysicsCard`,
`PhysicsCardImpl`, `CardRegistry`, `PhysicsLayer`. Transitions becomes a
consumer with a small named API (`list()`, `setKinematic()`, lifecycle
hooks).

**Why grill.** This is where runtime bugs hide — most other candidates are
about leverage and tests; this one is about correctness under timing. Real
open questions:
- What is the actual sequence of frames in a route transition? Write it down.
- Which steps must happen *before* a paint, which after? Today only the
  director knows.
- Is there a state machine hiding in the RAF prose comments? Naming its
  states makes the contract obvious.
- Can `CardRegistry` collapse into the director? (Two registries — this
  one and the minimize subsystem — is suspicious.)

**Linkage.** Touches the same triangle as Candidate 4 (minimize). Grilling
this likely absorbs the cascade-minimize half of Candidate 4. Falls
naturally after Candidate 1 (Tether extracted ⇒ card subsystem already has
a cleaner dependency for tether/subtree operations).

**ADR conflict?** No — ADR-0001 §10 (cascade-minimize) names the behaviour;
this is about honouring its seam in code.

### Resolution (2026-05-14)

The doc's "what is the actual sequence of frames?" question got the only
answer the question can have: a state machine. Slice 111 introduced
`CardLifecycle` (`spawning → active → exiting`), owned by the **registry**,
driven by the **Director** and **Primitive**s. The load-bearing artifacts:

- **Visibility now derives from state.** Spawning cards paint
  `visibility:hidden`; the RAF-ordered "reveal flag" is gone. Invariant I-1
  ("a Spawning Card never paints") is a property of the state machine and
  asserted directly in tests instead of being a prose comment.
- **Primitives drive activation.** Body primitives call
  `registry.activate(id)` after positioning the body. The Director
  coordinates by `arm()`/`disarm()`-ing the registry around each
  transition.
- **CardRegistry did NOT collapse into the Director.** The grill's
  subquestion resolved no — they're orthogonal concerns with separate test
  surfaces. The Director orchestrates transitions; the registry stores
  card identity (which exists outside transitions too — initial mount,
  drag, idle).
- **Folder structure follows separately** via Candidate 9: the card
  subsystem (registry, layer, per-entry renderer, author API, page
  renderer) moves into a dedicated `card/` folder, removing the
  `physics/ → transitions/` backward dependency.

CONTEXT.md's `CardLifecycle`, `Director`, `Primitive`, `Armed`,
`BodyDriver`, `TetherSpec` entries are the surviving vocabulary artifacts.

---

## Candidate 3 — Transition primitives are stateful closures bound to live `PhysicsWorld`

**Status: resolved. `BodyDriver` interface introduced; `PhysicsWorld` is one
adapter and `createFakeBodyDriver` is the other (the "two adapters = real
seam" check passes). Documented in CONTEXT.md (`BodyDriver`, `TetherSpec`)
via PR [#115](https://github.com/cpalaka/chaipalaka.com/pull/115).** Body
primitives (`pour-in-drop`, `string-cut-drop`, `anchor-slide`) drive bodies
through the `BodyDriver` seam; their tests run against
`createFakeBodyDriver` and assert the shape of motion, not just that the
call happened.

**Files**
- `web/src/transitions/dispatch.ts`
- `web/src/transitions/primitives/anchorSlide.ts`
- `web/src/transitions/primitives/pourInDrop.ts`
- `web/src/transitions/primitives/stringCutDrop.ts`
- `web/src/transitions/primitives/crossFade.ts`
- `web/src/transitions/primitives/types.ts`

**Problem.** A `PrimitiveStep` is `(dtMs) => boolean`. The closure captures
`PhysicsWorld` and mutates bodies directly. Animation math (easing,
keyframes, drop trajectories) can't be exercised without a matter.js world.
Tests check that *something* was dispatched, not the shape of the curve.

**Deletion test.** Deleting the primitives concentrates complexity inside
the director — a good signal that they're real modules. But their seam to
physics is leaky.

**Direction.** Primitives take a small `BodyDriver` interface
(`applyImpulse`, `setStatic`, `cutTether`, etc.) supplied by the director.
Tests run primitives against a `BodyDriver` fake and assert the *shape* of
the motion, not just that the call happened.

**Why grill.** Tightly linked to #1 and #2:
- If `Tether` becomes its own module (#1), `BodyDriver` is partially solved
  for free.
- The right surface for `BodyDriver` depends on what primitives actually do.
  Enumerate every body mutation each primitive performs before designing
  the interface — otherwise the adapter is shallow.

**Linkage.** Independent of Candidate 1 (#108). Can land in either order;
`BodyDriver` and `BodyForceSource` are siblings that share readonly query
methods but address distinct consumers (body primitives vs. tether rope
forces).

**ADR conflict?** No.

---

## Candidate 4 — Hook-singleton pattern repeated across four domains + cascade-minimize split

**Status: resolved. Both halves dissolved separately.**
- *Cascade-minimize half:* removed entirely via issue
  [#118](https://github.com/cpalaka/chaipalaka.com/issues/118) and ADR-0002.
  `MinimizedRegistry` and its hooks deleted; the feature itself was retired.
- *Hook-singleton half:* consolidated via issue
  [#117](https://github.com/cpalaka/chaipalaka.com/issues/117).
  `web/src/state/useController.ts` is the `useController` bridge hook;
  `useGallery`, `useFrameEdge`, `useTheme` now adopt it. The
  module-level `let instance` ritual still lives in each file (it's the
  unit of session-scoped identity per CONTEXT.md `Lazy singleton`) but the
  React subscribe boilerplate is one place. The original "merge into one
  primitive" idea narrowed: the `Controller` is the unit of behaviour and
  the singleton is the unit of identity; they correctly stay separate.

**Files (the singleton pattern, in production)**
- `web/src/canvas/useGallery.ts:16` — `let galleryInstance`
- `web/src/canvas/useFrameEdge.ts:22` — `let controllerInstance`
- `web/src/canvas/useMinimizedRegistry.ts:7` — `let registryInstance`
- `web/src/controls/useTheme.ts:26` — `let controllerInstance`

(The 5th case — `text/registry.ts`'s eager `export const registry = ...` —
is the same shape concern with different mechanics; see Candidate 7.)

**Files (cascade-minimize split, from ADR-0001 §10)**
- `web/src/canvas/MinimizedRegistry.ts` (clean factory; ~94 LOC)
- `web/src/canvas/useMinimizedRegistry.ts` (~44 LOC; the singleton lives here)
- Cascade-minimize logic spread across: `MinimizedRegistry`,
  `PhysicsCardImpl`, `TransitionDirector`

**Problem.** Two related concerns, worth keeping together because the fix
to one nudges the fix to the other.

*Singleton pattern.* Each of the four hook files re-implements the same
ritual: a module-level `let instance: T | null = null` + lazy init +
`useSyncExternalStore` (or `useEffect+useState`) wiring. The shape is
near-identical. Apply the deletion test to the *pattern*: deleting the four
hook files and inlining the subscribe logic would reproduce the same
five-line shape across N callers — so the pattern earns its keep, but it's
spelled four times rather than once. State-leak risk in tests: any hook
test that touches global state must manually reset the module-level `let`.
Four files, four chances to forget.

*Cascade-minimize.* The "minimize a parent → cascade the strung subtree
to one chip, restore the full subtree" behaviour from ADR-0001 §10 is a
single design decision, but its implementation lives in three files and
is tested in none of them as a single behaviour. `MinimizedRegistry`
exposes the singleton-style API but doesn't own the cascade — it's a
**shallow side** of what should be the right module.

**Deletion test.** Both concerns pass deletion-test individually
(`MinimizedRegistry` deleted ⇒ minimize logic reappears in three places;
singletons removed ⇒ subscribe boilerplate reappears in callers). The
question is whether each carries its *whole* job.

**Direction.**
1. Introduce one primitive — call it `createObservableStore<T>(initial, { persist? })`
   or similar — that produces both the imperative store interface and the
   React hook. Migrate gallery / frame-edge / minimized / theme to use it.
   Each domain module shrinks to "the domain-specific shape on top of one
   store"; the dedicated hook file disappears.
2. Pull cascade-minimize into the minimize registry as its public
   interface (`minimize(cardId)` cascades the strung subtree internally,
   `restore(cardId)` restores the full subtree). The registry becomes the
   seam for ADR-0001 §10.

**Why grill.**
- Does the minimize registry need to know about the tether tree to
  traverse the subtree, or should the tether module expose `subtreeOf(cardId)`?
  If `subtreeOf` is on tether, this candidate fuses with #1.
- Is the `createObservableStore` primitive worth designing here, or does it
  fall out naturally as a side-effect of cascading other refactors?
- What's the persistence story? Three of the four current hooks persist to
  localStorage; one doesn't. The primitive should encode that as an option,
  not as ambient behaviour.

**Linkage.** Fuses with #1 if `Tether.subtreeOf` is the right move. Fuses
partially with #2 (cascade-minimize touches the director/registry triangle).

**ADR conflict?** No — ADR-0001 §10 already named the concept; this honours
its seam.

---

## Candidate 5 — Particle scenes duplicate the param schema across many files

**Status: resolved via #122–#124 (design + DSL + generic Tuner). `paramSchema.ts`
+ `tunable.ts` ship the schema-once-→-(type, defaults, UI, serializer)
pattern. CONTEXT.md `SceneParamSchema` and `Tuner` are the artifacts.** Per
the grill's question on Zod: a small local DSL was the right call given
canvas bundle-size sensitivity.

**Files**
- `web/src/canvas/scenes/particles-*.tsx` (4 particle scenes, ~220–384 LOC each)
- `web/src/canvas/scenes/geometric-*.tsx` + `flow-shader.tsx` +
  `audio-reactive.tsx` (5 more, same pattern)
- `web/src/canvas/scenes/manifest.json`, `index.ts` (a manifest layer
  already exists for scene loading)
- `web/src/sandbox/particles/*Tune.tsx` (7 tuners + `TunePanel.tsx`,
  mirroring the scenes)

**Problem.** Each scene re-declares a `*Params` interface, a `DEFAULT_PARAMS`
object, and an inline `{ key, label, type, min, max, step }` array used by
its tuner. The tuner serializes manually via `JSON.stringify(params)`. The
deletion test cuts the other way here: there's no shared module to delete —
the duplication is across files.

A scene manifest (`canvas/scenes/manifest.json` + `index.ts`) already
exists for scene *registration*. The candidate is to extend that pattern
to cover *params* as well.

**Direction.** A `SceneParamSchema<T>` module: one schema declaration
produces (a) the typed default object, (b) the tuner UI fields, (c) the
URL/JSON serializer. Adding a new scene = one schema declaration; the
tuner UI is generic.

**Why grill.** Smallest blast radius, easiest win, good warm-up. Real
risk: over-engineering. Verify before designing:
- Are the schemas similar enough that one captures them, or are there
  enough one-off fields per scene that the abstraction is more complex
  than the duplication?
- Is Zod (already in the repo for blog frontmatter) worth pulling into the
  canvas bundle, or is a small local DSL the right call given canvas
  bundle-size sensitivity?
- How does this compose with the existing `scenes/manifest.json` + `index.ts`
  — extend that manifest, or sit alongside?

**Linkage.** Independent of every other candidate.

**ADR conflict?** No.

---

## Candidate 6 — `canvas/registry.ts`: shallow Map wrapper, two callers

**Status: resolved by deletion via issue
[#125](https://github.com/cpalaka/chaipalaka.com/issues/125). `BackgroundRegistry`
collapsed into `BackgroundGallery`; `canvas/registry.ts` deleted. Deletion
test signal that the doc flagged ("complexity does not reappear across N
callers") was correct.**

**Files**
- `web/src/canvas/registry.ts` (~19 LOC) — `createRegistry`: a Map wrapper
- `web/src/canvas/gallery.ts` (~97 LOC) — calls `createRegistry`; doesn't reuse internals
- `web/src/canvas/useGallery.ts` — also calls `createRegistry` separately

**Problem.** A factory whose only public behaviour is "wrap a Map, throw on
duplicate id." Two production call sites, both in the gallery subsystem.
The deletion test fails loudly: deleting `createRegistry` removes ~2 calls;
complexity does **not** reappear across N callers.

It also seems suspicious that `gallery.ts` and `useGallery.ts` independently
build their own registries — likely related to Candidate 4's hook/module
split, and likely a side-effect to clean up there.

**Direction.** Inline the 19 LOC into `gallery.ts` (its single meaningful
consumer). Keep `MinimizedRegistry` separate because it carries domain
behaviour, not generic lookup.

**Why grill.** Quick win. Main question is whether `createRegistry` is
load-bearing for a future use case (a second registry domain). Deletion-test
signal is loud now; revisit if a real second adapter appears later.

**Linkage.** Falls out naturally during Candidate 4 grilling, since the
gallery/useGallery split is the same hook-pattern smell.

**ADR conflict?** No.

---

## Candidate 7 — `text/PretextRegistry` has exactly one caller

**Status: grilled 2026-05-13 + shipped via issue
[#127](https://github.com/cpalaka/chaipalaka.com/issues/127) (PR #129).
Decision: reframe + narrow.** See "Grill outcome" below.

**Files**
- `web/src/text/PretextRegistry.ts` — the class
- `web/src/text/registry.ts` — module-level eager singleton
  (`export const registry = new PretextRegistry()`)
- Production caller: `web/src/routes/blog/BlogIndex.tsx` only

**Problem.** A module-level singleton with one caller. Other components that
pick fonts hardcode them in CSS. Leverage is zero; the locality argument is
"future blog pages will use it." The "one adapter = hypothetical seam,
two adapters = real seam" principle bites here.

**Deletion test.** Removing the registry inlines ~3 font lookups into
`BlogIndex`. Complexity does not multiply.

**Direction.** Pick a side:
- **Delete** — inline the few `getFontFor*` calls into `BlogIndex`. The
  registry can come back when the second caller arrives.
- **Commit** — use the registry from every component that picks a font;
  rip the inline CSS font specs out of components. The registry becomes
  load-bearing.

**Why grill.** The grill is about whether future blog pages are real enough
to justify the hypothetical seam, or whether the right move is "delete now,
re-introduce when the second caller appears."

**Linkage.** Independent.

**ADR conflict?** No.

### Grill outcome (2026-05-13)

**Reframe.** The module is not a "font registry." Its load-bearing surface
is `measure(text, font, maxWidth)` — a pre-paint text-measurement
primitive built on `@chenglou/pretext`. `getFont` / `getLineHeight` are
dead Interface surface (no production callers). The framing "delete vs.
commit as font source of truth" is wrong.

**Assumption.** A future feature parked in
`memory/project_pretext_use_cases.md` — (α) prose reflowed around physics
cards — will make text-layout a tick-rate central concern. Under that
assumption, the **delete** branch is off the table; the **commit as
font-source-of-truth for CSS components** branch was always wrong (CSS
cascade still does rendering); the answer is **reframe + narrow** with a
shape designed for α's growth.

**Drift bug discovered during the grill.** `registry.ts` declares
`'Newsreader Variable'` for the `body` and `card-title` keys, but
`base.css` `@font-face`s only `IBM Plex Sans` and `JetBrains Mono
Variable`. CSS uses `--font-body = 'IBM Plex Sans'` to render. So today,
blog-index card heights are measured with one family and painted with
another — the canvas falls back to a generic when `Newsreader Variable`
is requested. The unit-pinned font specs in `registry.test.ts` caught the
*desired* value but never compared it to what CSS actually loads. This is
the motivating example for the drift-discipline test in the new shape.

**Module shape chosen.**
- Shape: pure functions + value type (not a class, not a registry).
- Naming: **Font** as a value type, **TextMeasure** as the measurement
  operation. Both terms now in `CONTEXT.md` under "Text and measurement."
- Files (proposed):
  - `web/src/text/fonts.ts` — `Font` value type + `FONT_BODY`,
    `FONT_MONO`, `FONT_CARD_TITLE` consts.
  - `web/src/text/measure.ts` — `measure(text, font, maxWidth)` function.
  - Both old files (`PretextRegistry.ts`, `registry.ts`) deleted.
- Drift policy: **D3** — a unit test parses `tokens.css` for
  `--font-body` / `--font-mono` and asserts agreement with `fonts.ts`.
  Catches the discovered drift bug; cheap; no build-step infra needed.

**Drift bug resolution (2026-05-13).** Chose **option (a) — drop the
Newsreader Variable intent and align to IBM Plex Sans**, which is what
the site actually paints today. `FONT_BODY` and `FONT_CARD_TITLE` will
declare `'IBM Plex Sans'`. No visible change for users; cheapest fix;
no bundle additions. The "editorial serif body" idea is parked and can
return as a deliberate typography slice if Chai wants it later.

**Today's slice deliverables (small):**
1. Introduce `fonts.ts` and `measure.ts` as above; delete the old files.
2. Migrate `BlogIndex.measure.ts` + `BlogIndex.tsx` to the new shape.
3. Add the drift test.
4. Apply option (a) — `FONT_BODY` / `FONT_CARD_TITLE` become IBM Plex
   Sans to match `base.css`.
5. `CONTEXT.md` already updated with **Font** + **TextMeasure**.

**Deferred (lands with α):**
- `layoutFlow(text, font, obstacles)` for variable-width line streaming.
- A peer `Prose` / `TextField` module that consumes `layoutFlow`.
- Domain term **ProseFlow** (or similar) added to `CONTEXT.md` at that
  time.

**Issue:** [#127](https://github.com/cpalaka/chaipalaka.com/issues/127)

---

## Candidate 8 — `PageDef` is a grab-bag **Interface** spanning three subsystems

**Status: grilled 2026-05-14 + shipped via issue
[#130](https://github.com/cpalaka/chaipalaka.com/issues/130) (PR #132).
Decision: two-way split + relocate to `routes/`.** See "Grill outcome"
below.

**Files**
- `web/src/physics/PageDef.ts` — main type (`gravity`, `cards`, `sections`)
- `web/src/transitions/pageDefs.ts` — route → PageDef map; adds `transitions: { exit, enter }`, `siblingOrder`
- Consumed by: `physics/PhysicsPage`, `transitions/TransitionDirector`,
  `transitions/dispatch`, `canvas/useFrameEdge` (indirectly via frame insets)

**Problem.** One **Interface** is read by three subsystems. Physics reads
`gravity` + `cards`; transitions reads `exit` / `enter` / `siblingOrder`;
sections pagination reads `sections`. The type documents no invariant about
which fields belong to whom; a new field (e.g., "preferred background scene,"
"frame-bar color override") has no natural home. The depth problem: a
change to one subsystem's needs surfaces in an interface every other
subsystem also has to read; tests for transition dispatch have to fake
physics fields and vice versa.

**Deletion test.** Can't delete — every subsystem reads it. But each
subsystem reads only a slice; the unified type is forcing every caller to
import every other subsystem's concerns.

**Direction.** Decompose into focused sub-interfaces composed via
intersection:

```ts
type PageDef = PhysicsPageSpec & TransitionPageSpec & Partial<SectionPageSpec>
```

Each subsystem imports only the spec it consumes; routes compose only the
specs that apply.

**Why grill.**
- Where does an `insets` / frame-bar-influencing field belong — is there a
  fourth subsystem implicit here?
- Sections pagination is currently `Partial<>` — does that survive once
  Slice 21b lands, or should it become required-for-section-routes?
- Does the route-keyed map (`pageDefs.ts`) belong in transitions, in
  physics, or in a third place? (Today's import-time map vs runtime
  registration question lives here.)

**Linkage.** Cheap, type-only, independent of every other candidate.

**ADR conflict?** No.

### Grill outcome (2026-05-14)

**Reframe — doc had two factual drifts.**
- `transitions/pageDefs.ts` does NOT add fields on top of `PageDef`.
  It is a 21-line route-keyed map (`Record<string, PageDef>`); ALL
  fields live in the single `PageDef` interface in
  `physics/PageDef.ts`. The grab-bag really is one type owned by
  physics — that makes the candidate stronger, not weaker.
- `canvas/useFrameEdge` does NOT consume `PageDef`. Frame insets flow
  via `useFrameEdge → PhysicsContext → PhysicsWorld.setViewport(...)`,
  fully orthogonal. The doc's "where does an `insets` field belong"
  grill question is parked — there is no current pressure for such a
  field.

**Cross-cutting reality.** The doc's "physics reads gravity+cards;
transitions reads x/y/z; sections reads sections" undercounted. Actual
consumer map at grill time:
- `cards`: read by physics (`PhysicsPage`) AND sectioning
  (`partitionPageDef`).
- `sections`: read by sectioning AND transitions (4 call sites across 2
  subsystems, all truthiness-only on the transitions side).
- `sectionsPushHistory`: zero consumers — dead Interface surface.

**Decisions.**
1. **Sectioning is a consumer, not a subsystem.** `partitionPageDef` is
   a pure function over `(PageSpec, viewport, routeKey, heights)`. The
   `Partial<SectionPageSpec>` arm of the doc's three-way intersection
   dissolves.
2. **Two-way split, not three-way.** `PageSpec` (route-author intent —
   `gravity`, `cards`, `sections?`) ∩ `TransitionSpec`
   (transition-author intent — `transitions?`, `siblingOrder?`).
3. **No predicate seam between transitions and sectioning.** Transitions
   reads `pageDef.sections` truthiness-only; the shape of
   `SectionsConfig` is already encapsulated in
   `layout/sectionLayout.ts`. An `isPaginated(pageDef)` predicate would
   add zero leverage.
4. **`PageDef` lives in `routes/`.** Route authors compose a `PageDef`;
   `routes/` is the honest home. Physics and transitions stand
   independent of each other at the type level (no backward
   cross-folder type dependency).
5. **Static map (`pageDefs.ts`) moves to `routes/`.** Directory of
   route-author intents, not a transition concern.

**Module shape chosen.**
- `web/src/physics/PageSpec.ts` (rename of `PageDef.ts`) — owns
  `PageSpec`, `CardSpec`, `SectionsConfig`, `Cardinal`, `Buoyancy`,
  `ParentRef`, `CardKind`, and `buoyancyForKind`.
- `web/src/transitions/TransitionSpec.ts` (new) — owns
  `TransitionSpec`, `TransitionId`.
- `web/src/routes/PageDef.ts` (new) —
  `export type PageDef = PageSpec & TransitionSpec`.
- `web/src/routes/pageDefs.ts` (moved from `transitions/`) — the
  static route-keyed map.

**Deferred (out of scope for this slice).**
- Unifying the dual routing mechanism (static `pageDefs` map + runtime
  `PageDefRegistry`). The dual mechanism is the deliberate output of
  the 21b grilling session (2026-05-12) and reflects a load-bearing
  asymmetry between module-time-known and render-time-known PageDefs.
  Revisit only if that asymmetry stops being load-bearing.

**Freebies folded into the slice.**
- Delete `sectionsPushHistory` (dead Interface surface).
- Fix two stale doc-comments referring to "Slice 21b will introduce a
  pattern-matching variant" — 21b shipped the runtime registry instead;
  pattern-matching is not pending work.

**CONTEXT.md updates.** Add `PageSpec` and `TransitionSpec` entries;
update the `PageDef` entry to "the composition of a **PageSpec** and a
**TransitionSpec**."

**Issue:** [#130](https://github.com/cpalaka/chaipalaka.com/issues/130)

---

## Candidate 9 — `transitions/` has no declared **Seam**

**Status: grilled 2026-05-14. Decision: reframe — extract a `card/`
subsystem; declared seams for both `card/` and `transitions/`; bundled
renames and freebie cleanups.** See "Grill outcome" below.

**Files:** all of `web/src/transitions/` (~16 files plus the `primitives/`
subfolder).

**Problem.** What `CanvasLayout.tsx` and routes actually import from this
folder is small: `TransitionDirector`, `PageDefRegistryProvider`,
`useTransitionContext`. The rest — `dispatch`, `classifyDirection`,
`edges`, primitives, `useHashSection` — is internal. No `index.ts`, no
documented public surface. A maintainer can't tell at a glance which
symbols are stable. The interface is *implicit*; the seam isn't named,
which makes the module look shallower than it actually is.

This compounds with Candidate 2: once `CardRegistry`, `PhysicsCardImpl`,
and `PhysicsLayer` move out to a card module, what remains in `transitions/`
is genuinely "how do we animate route changes" — and the seam can be
declared cleanly.

**Direction.** After Candidate 2, give `transitions/` an explicit `index.ts`
re-exporting only the public surface. Internals stay un-exported. The
module becomes deep by construction: small named interface, complex
internals.

**Why grill.** Smallest of the candidates; mostly mechanical. The grill is
about which symbols are stable enough to be in the public surface vs.
internal-only.

**Linkage.** Follows Candidate 2 naturally.

**ADR conflict?** No.

### Grill outcome (2026-05-14)

**Reframe — doc had three drifts.**
- The doc's claim that external imports are *"`TransitionDirector`,
  `PageDefRegistryProvider`, `useTransitionContext`"* undercounted. Actual
  external production-code imports were 10 symbols across 3 sibling
  folders (`layouts/`, `physics/`, `routes/`). The narrow-surface framing
  was wrong; the surface is wide AND incoherent.
- `useTransitionContext` (exported at `TransitionDirector.tsx:52`) had
  **zero production or test callers** — dead Interface surface, same
  pattern as Candidate 8's `sectionsPushHistory` freebie.
- The doc framed #9 as a follow-up to #2. The reverse is closer to true:
  honestly grilling #9 forces #2's resolution. (#2's state-machine half
  shipped via slice 111 separately; #2's folder half is delivered here.)

**Cross-folder reality.** Two backward edges revealed the unnamed
subsystem:
- `physics/PhysicsContext.tsx:10` wraps children in `<CardRegistryProvider>`
  imported from `transitions/`.
- `physics/PhysicsCard.tsx:55` calls `useCardRegistry()` from `transitions/`.

These pointed at a **card subsystem** with no folder — registry +
per-entry renderer + layer (in `transitions/`) plus author API + page
renderer (in `physics/`). The folder name `transitions/` actively misled:
`CardRegistry` and `PhysicsCardImpl` are card-subsystem concerns, not
transition concerns.

**Decisions.**

1. **Extract `card/` folder.** Both `physics/` and `transitions/` shrink.
   Three-folder world: `physics/` (matter.js + bodies + tether + page
   spec), `card/` (the React surface of Cards — registry, layer,
   per-entry renderer, author API, page renderer), `transitions/` (route
   animation — Director, dispatch, primitives, edges, hash watcher,
   PageDefRegistry).
2. **Move `PhysicsCardImpl` whole into `card/`.** Don't split JSX vs.
   body-wiring during this slice. AI-navigability wins more from
   folder-name-matches-concept than from in-file splitting; the in-file
   split is speculative without a forcing function (no test or behaviour
   pushing on it). Defers the speculative split as new Candidate 10.
3. **All-in `PhysicsX → X` rename for card-side identifiers.**
   `PhysicsCard → Card`, `PhysicsPage → Page` (inside `card/`,
   unambiguous), `PhysicsLayer → CardLayer` (the prior name was a misread:
   it's a layer of cards, not a layer of physics), `PhysicsCardImpl →
   CardImpl`. Types: `PhysicsCardProps → CardProps`,
   `PhysicsCardEntry → CardEntry`. Physics-side identifiers
   (`PhysicsWorld`, `PhysicsContext`, `PhysicsProvider`) keep their names
   — they're physics-side. CSS class `physics-card` stays in HTML
   (separate stability story; not load-bearing).
4. **Move `wireTetherFor` from `card/Card.tsx` to `physics/Tether.ts`.**
   It's tether-wiring, not card-author concern; its only caller is
   `CardImpl`. Removes one cross-import smell that would otherwise outlive
   the refactor.
5. **`PhysicsContext` stops wrapping `<CardRegistryProvider>`.**
   `CanvasLayout` mounts it directly:
   `<PhysicsProvider><CardRegistryProvider>…`. Clear owner; no implicit
   coupling.
6. **Declare seams via `index.ts` files** for both `card/` and
   `transitions/`. Honors the original Candidate 9 spirit but at the new
   (correct) granularity. Public exports:
   - `card/index.ts` — `Card`, `CardProps`, `Page`, `CardContent`,
     `CardLayer`, `CardRegistryProvider`, `useCardRegistry`, types
     (`CardEntry`, `CardLifecycle`, `CardActivator`).
   - `transitions/index.ts` — `TransitionDirector`,
     `PageDefRegistryProvider`, `useRegisterPageDef`,
     `usePageDefRegistry`, `useHashSection`, `TransitionSpec`,
     `TransitionId`, `edges`.
7. **Bundled freebies.**
   - Delete `useTransitionContext`, `TransitionContextValue`,
     `RunTransitionArgs`, and the entire `TransitionContext` wiring in
     `TransitionDirector.tsx` (dead Interface surface).
   - Move `transitions/NavCardContent.tsx` → `routes/blog/NavCardContent.tsx`
     (single caller in `BlogIndex`; misleadingly named — it's section-nav
     button content for blog pages, not a generic "nav card").

**Module shape chosen.**
```
web/src/
  card/                       ← new
    Card.tsx, Card.css, Card.test.tsx
    Page.tsx, Page.test.tsx
    CardRegistry.tsx, CardRegistry.test.tsx
    CardRegistryStore.test.ts
    CardLayer.tsx, CardLayer.test.tsx
    CardImpl.tsx, CardImpl.test.tsx
    index.ts                  ← declared seam
  physics/                    ← shrinks
    PhysicsWorld.ts, PhysicsContext.tsx
    Tether.ts (gains wireTetherFor)
    BodyDriver.ts, BodyForceSource.ts, createFakeBodyDriver.ts
    PageSpec.ts, usePageDef.ts
  transitions/                ← shrinks
    TransitionDirector.tsx (no useTransitionContext)
    TransitionSpec.ts, PageDefRegistry.tsx, dispatch.ts
    edges.ts, classifyDirection.ts, useHashSection.ts
    primitives/
    index.ts                  ← declared seam
  routes/blog/
    NavCardContent.tsx        ← moved from transitions/
```

**Dependency graph after the slice.**
- `routes/` → `card/{Card, Page}`, `transitions/{useRegisterPageDef,
  useHashSection, TransitionSpec}`
- `layouts/` → `card/{CardLayer, CardRegistryProvider}`,
  `physics/PhysicsProvider`, `transitions/{TransitionDirector,
  PageDefRegistryProvider, edges}`
- `card/` → `physics/{PhysicsWorld, PhysicsContext, PageSpec, Tether}`
  *(forward only ✓)*
- `physics/` → nothing in `card/` or `transitions/` *(fully decoupled ✓)*
- `transitions/` → `physics/{PageSpec, PhysicsContext, PhysicsWorld}`,
  `card/{useCardRegistry, CardEntry, CardActivator}` *(forward only ✓)*,
  `routes/PageDef` *(type, deliberate; see Candidate 8)*

Two backward edges deleted; one cross-folder function smell resolved;
one dead Interface surface deleted; one misleadingly-located component
relocated.

**CONTEXT.md updates** (land with implementation, not now):
- **Remove** the "PhysicsCard is a code identifier... — Card is" entry
  under "Flagged ambiguities." Gap closed.
- **Add `CardLayer`** entry under "Foreground physics" or "Architecture":
  the React layer mounted once at app root that renders every active
  **Card** via the **CardRegistry**; survives route unmount.
- *(No `CardImpl` term — private internal of `CardLayer`.)*

**Deferred (not in this slice).**
- The `CardImpl` internal split (JSX shell vs. body wiring) — surfaced
  during this grill, parked as new Candidate 10. No current motivation
  forces it.
- CSS class `physics-card` → `card`. Cosmetic; touches CSS rules; worth
  its own tiny slice if desired.
- PageDefRegistry dual-mechanism unification (deferred from Candidate 8;
  still load-bearing per #130 grill outcome).

**Slice naming.** Branch: `refactor/extract-card-subsystem`. Issue title:
*"Extract card/ subsystem (rename PhysicsCard → Card, decouple physics
from transitions)"*. Scope: ~22 file moves/renames + ~25 import-path
updates across routes, tests, layouts. Mechanical; one PR (rename + move
are entangled).

**Issue:** [#133](https://github.com/cpalaka/chaipalaka.com/issues/133)

---

## Candidate 10 — `card/CardImpl` is a fat multi-concern file

**Status: grilled 2026-05-14. Decision: Path A — extract pure helpers,
no new module.** The doc's proposed `CardView` / `CardBody` split was
considered and deferred. See "Grill outcome" below.

**Files** (post-Candidate-9):
- `web/src/card/CardImpl.tsx` (~290 LOC)

**Problem.** `CardImpl` does six things in one file: renders the
`<article>` JSX, spawns the body via `world.registerById`, wires tethers
(via `physics/Tether.wireTetherFor` post-Candidate 9), resolves parent
refs against the world, wires drag/fling pointer listeners, and honors
invariant I-1 (Spawning → `visibility:hidden`). Its outward interface is
small (a React component, single `entry` prop, stable), but inside it the
JSX-shell concerns and the body-wiring concerns are tangled. Currently
testable only end-to-end via React rendering + a real `PhysicsWorld`; the
body-wiring layer can't be exercised independently.

**Deletion test.** Each concern is load-bearing. The shallowness is
internal: the seam between "card React surface" and "card body wiring"
exists conceptually but isn't expressed in code.

**Direction (one option among several to grill).** Split into
`card/CardView.tsx` (JSX + `state → visibility` + ref-to-body bridge) and
`physics/CardBody.ts` (spawn + tether + drag + parent resolution +
lifecycle synchronization). `CardBody` becomes testable without React.
`CardView` becomes a thin renderer over the registry entry.

**Why grill.** Real open questions:
- What is the right interface between View and Body? A ref-bridge? An
  imperative handle? An attach/detach pair?
- Does the lifecycle synchronization (Spawning → `visibility:hidden`)
  survive a split, or does it leak across both files?
- Is the split worth it without a second use case (e.g., a "headless card"
  with no DOM)? If not, this candidate stays parked.

**Linkage.** Independent now that Candidates 1, 2, 9 are done.

**ADR conflict?** No.

**Recommended trigger.** Don't grill until a real motivation appears —
for example: a new **Card** kind that needs body-wiring without DOM, a
hard-to-write test where body-attach behaviour isn't exposable through
the React surface, or a perf concern requiring body-attach memoization
independent of React renders.

### Grill outcome (2026-05-14)

**Reframe.** The doc parked this pending one of the recommended triggers
above. The grill kicked off against a different motivation —
AI-navigability and codebase extensibility. That framing shifts the
question from *"is the split worth it without a second use case?"* to
*"does a 290-LOC file with ~9 entangled concerns hurt navigability
enough to act now?"* Different question, potentially different answer.

**Drift check.** The "six things in one file" claim undercounts. Actual
concerns: JSX shell + I-1 visibility honoring, spawn-offset math, body
registration with the `onTransform` DOM bridge, buoyancy application,
parent tether wiring with one-frame RAF retry, trail tether wiring (the
same shape duplicated), `resolveParent` helper, drag/fling pointer
handlers, anchor/parent/trail-change re-wiring effect, cleanup. Closer
to nine than six. `CardImpl.tsx` = 290 LOC verified; `CardImpl.test.tsx`
= 359 LOC (the test file is *larger* than the implementation — a smell
the doc didn't flag).

**Test-surface signal.** Every test mounts `PhysicsProvider` +
`CardRegistryProvider` + a real `PhysicsWorld` to exercise math (fling
velocity, spawn offset) that could be 10-line pure functions. The test
surface alone is a load-bearing argument for *some* extraction, even
without a second production adapter.

**Decisions.**

1. **Path A over Path B.** Extract pure helpers; no `CardView` /
   `CardBody` module split; no new seam. The case-for-splitting reduces
   to "the math is test-worthy in its own right"; Path A captures that
   without committing to a production-side interface the codebase
   hasn't asked for. Honors the *"one adapter = hypothetical seam"*
   discipline shown in the Candidate 1 resolution (declined MatterEngine
   and BalloonForces on the same grounds). Reversible — if a real second
   adapter appears later (e.g. headless cards, Stuff/Flash-style cards
   without the same React surface), lifting the helpers into a `CardBody`
   module is then mechanical.

2. **`computeSpawnOffset(anchor, gravity, offsetPx) → {x, y}`** in a new
   file `card/spawnOffset.ts`. Pure function. `offsetPx` is a
   parameter, not a baked-in constant — that's what gives it a real test
   surface. Tests cover: gravity-direction cases, normalisation of a
   non-unit gravity vector, the zero-length-gravity fallback to
   `(0, 1)` (the silent-default branch nobody asserts today).

3. **`computeFlingImpulse(delta, sinceLastMoveMs, config) → {vx, vy}`**
   in a new file `card/flingImpulse.ts`. Pure function. Tests cover:
   normal fling, paused-before-release zero-out (when `sinceLastMoveMs >
   config.pauseMs`), the `Math.max(dt, 1)` divide-by-zero guard.

4. **`resolveParent` moves to `physics/Tether.ts`.** It is physics
   knowledge dressed up as a card helper — `card/` shouldn't have to
   know that `'ceiling'` resolves to `world.ceilingHandle`. Colocated
   with `wireTetherFor`, the only function that consumes its
   `parentKind` return. Return type tightened to
   `NonNullable<ParentRef>` input and
   `{ handle, kind } | null` output; `null` now means exactly one thing
   (card-id given but no body registered yet). Removes the dead "no
   parent intended" branch the previous loose type allowed.

**What does NOT change.**

- No new module. No new seam. No interface design.
- `CardImpl` remains the React surface and the only production consumer
  of the helpers.
- I-1 stays expressed where it is (`entry.state === 'spawning'` →
  `visibility: 'hidden'` in the JSX). Unchanged.
- Tether retry policy (one-frame RAF, then `console.warn` and skip)
  stays in `CardImpl`. Surfaced during the grill as a load-bearing
  un-tested policy; not in scope.
- `CONTEXT.md` is unchanged. Which module file owns `resolveParent` is
  a code fact, not a domain-language fact.

**Estimated impact.** `card/CardImpl.tsx` drops ~290 → ~250 LOC. Two new
pure-function files (~30 LOC each) + their tests land in `card/`.
`physics/Tether.ts` gains `resolveParent` and a few test cases. Three
named, navigable, test-isolatable concepts now exist where one fat
closure did the work.

**Deferred (not in this slice).**

- Path B (the doc's `CardView` / `CardBody` module split). Re-grill if a
  real motivation appears.
- The "fuse `resolveParent` into `wireTetherFor`" option (Option 3 from
  the resolveParent grill leg). Cleaner but requires deciding where the
  RAF retry policy lives — a separable design question.
- A regression test for the tether-retry policy itself. Load-bearing
  ("retry once after a RAF, else warn-and-skip"), currently untested.

**Issue:** [#136](https://github.com/cpalaka/chaipalaka.com/issues/136)

---

## Cross-cutting observations (not full candidates)

### `layout/` vs `layouts/`

- `web/src/layout/sectionLayout.ts` — function that partitions a `PageDef` into
  sections.
- `web/src/layouts/PlainLayout.tsx` + `CanvasLayout.tsx` — React layout shells.

Two directories with confusingly similar names doing different things.
Pure naming friction. Rename `layout/` → `sectioning/` (or whatever domain
word survives a grilling against a future `CONTEXT.md`).

### `CONTEXT.md` (resolved)

`CONTEXT.md` was created during the Candidate 7 grill (2026-05-13) and has
been grown by each subsequent grilling session. New domain terms and
resolved ambiguities land in it inline as grilling produces them.

### `sandbox/` exists in parallel with production

`web/src/sandbox/cards/`, `web/src/sandbox/particles/`, and
`web/src/routes/sandbox/*` carry experimental cards / scenes / routes
parallel to the production folders. Worth being explicit during any grilling
whether a proposed deepening applies to both sides or only production.
Sandbox state-leak across tests (Candidate 4) potentially shows up here too.

### Backend candidates are deferred

`api/src/server.ts` is a small Bun service. The PRD's `LastFmAdapter`,
`LetterboxdAdapter`, `GitHubAdapter`, `CacheLayer`, `MDXBookReader`,
`NotesReader` mostly don't exist yet. No deepening candidates surfaced
here because there's nothing shallow to deepen. Revisit once those modules
land.

---

## Linkage map

Several candidates fuse if you pick one:

- **#1 + #3** — extracting `Tether` from `PhysicsWorld` partially solves the
  `BodyDriver` interface that primitives need.
- **#1 + #4** — if `Tether` exposes `subtreeOf(cardId)`, the minimize
  registry can call it instead of re-implementing tree traversal.
- **#2 + #4** — both touch the director / registry triangle. Grilling #2
  may absorb the cascade-minimize half of #4 entirely.
- **#4 + #6** — both touch the `gallery.ts` / `useGallery.ts` split;
  cleaning up the hook-singleton ritual likely resolves #6 in passing.
- **#2 → #9** — declaring the `transitions/` seam is the natural follow-up
  to extracting the card subsystem.
- **#5, #7, #8** — independent of all others.

---

## Recommended grilling order

Reflects status as of 2026-05-14. Every original candidate has either
shipped or has a recorded "Grill outcome" or "Resolution" section. Open
work:

1. **Candidate 9 slice — issue
   [#133](https://github.com/cpalaka/chaipalaka.com/issues/133).** Card
   subsystem extraction. Mechanical move + all-in rename + freebie
   cleanups; one PR.
2. **Candidate 10 slice — issue
   [#136](https://github.com/cpalaka/chaipalaka.com/issues/136).**
   Path A: extract `computeSpawnOffset` and `computeFlingImpulse` as
   pure-function helpers in `card/`; move `resolveParent` to
   `physics/Tether.ts` with a tightened return type.

Closed / shipped:

- **#1** — partial (Tether shipped; BalloonForces/MatterEngine resolved
  against extraction).
- **#2** — shipped (slice 111 state machine + Candidate 9 folder).
- **#3** — shipped (BodyDriver + fake adapter).
- **#4** — shipped (#117 useController + #118 minimize removal).
- **#5** — shipped (#122–#124 paramSchema + Tuner).
- **#6** — resolved by deletion (#125 BackgroundRegistry collapse).
- **#7** — grilled + shipped (#127 / PR #129 TextMeasure).
- **#8** — grilled + shipped (#130 / PR #132 PageDef split).

New candidates surfaced during 2026-05-14 work:

- **Candidate 10** — `CardImpl` internal split. Grilled 2026-05-14 (Path
  A — extract pure helpers, defer the `CardView` / `CardBody` module
  split).

The cross-cutting observations below (`layout/` vs `layouts/`; sandbox
parallelism; deferred backend candidates) remain open and have not been
promoted to full candidates yet.
