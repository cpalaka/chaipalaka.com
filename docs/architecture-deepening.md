# Architecture deepening — candidate list for grilling

**Status:** Draft. None of these are committed; this is raw material for the
`/improve-codebase-architecture` skill's grilling loop.
**Created:** 2026-05-12, merged 2026-05-13.
**Supersedes:** `architecture-deepening-candidates.md` and
`architecture-deepening-second-pass.md` — both are predecessor working notes
that can be removed once this file is reviewed.
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
5. **There is no `CONTEXT.md`.** The skill's vocabulary discipline depends on
   one; creating it (by extracting the domain glossary from `PRD.md`) should
   happen as a side effect of the first real grilling session, not as a
   separate task.

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

---

## Candidate 2 — Transitions ↔ PhysicsCard ↔ Registry: contract lives in RAF order

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

---

## Candidate 3 — Transition primitives are stateful closures bound to live `PhysicsWorld`

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

**Linkage.** Falls naturally after Candidate 1.

**ADR conflict?** No.

---

## Candidate 4 — Hook-singleton pattern repeated across four domains + cascade-minimize split

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

---

## Candidate 8 — `PageDef` is a grab-bag **Interface** spanning three subsystems

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

---

## Candidate 9 — `transitions/` has no declared **Seam**

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

---

## Cross-cutting observations (not full candidates)

### `layout/` vs `layouts/`

- `web/src/layout/sectionLayout.ts` — function that partitions a `PageDef` into
  sections.
- `web/src/layouts/PlainLayout.tsx` + `CanvasLayout.tsx` — React layout shells.

Two directories with confusingly similar names doing different things.
Pure naming friction. Rename `layout/` → `sectioning/` (or whatever domain
word survives a grilling against a future `CONTEXT.md`).

### No `CONTEXT.md`

The skill's vocabulary discipline depends on `CONTEXT.md` for domain terms.
There isn't one yet. If any candidate is grilled, the new module name (and
any sharpened domain terms) should land in a freshly-created `CONTEXT.md`
so the next pass uses the same words.

The PRD has the domain vocabulary embedded in prose; extracting a glossary
from it is itself a worthwhile side effect of the first real grilling
session.

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

A reasonable order if doing several. None of this is committed — pick
whichever the next session has appetite for.

1. **#1** (foundation: `Tether` extraction from `PhysicsWorld`).
2. **#2** (transitions/card contract, named explicitly; the cascade-minimize
   half of #4 falls out here).
3. **#3** (`BodyDriver` for primitives, now possible because Tether exists).
4. **#4** (the broader hook-singleton primitive across gallery / frame-edge /
   minimized / theme; absorbs #6 in passing).
5. **#8** (PageDef sub-interfaces — cheap, type-only).
6. **#9** (transitions/ declared seam, after #2 settles the contents).
7. **#5, #7** (independent cleanups; #5 is good as a standalone warm-up).

Bias toward the smaller blast-radius items (#5, #7, #8) if the session is
short and you want a contained win. Bias toward #1–#3 if the goal is
"where the runtime bugs hide."
