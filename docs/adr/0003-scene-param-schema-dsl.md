# ADR 0003: Scene param schemas use an in-repo DSL, not Zod

**Date:** 2026-05-13
**Status:** Accepted
**Issues:** TBD — slice from `docs/architecture-deepening.md`
Candidate 5 (particle scenes duplicate the param schema across many files)

---

## Context

Seven of the nine **BackgroundScene** modules (the four `particles-*`
scenes and the three `geometric-*` scenes) are tunable. Each one today
declares its parameters three times:

1. A `*Params` TypeScript interface (the key/type shape).
2. A `DEFAULT_PARAMS` value (the defaults).
3. A `FIELDS: FieldDef[]` array in the corresponding `sandbox/particles/*Tune.tsx`
   file (the UI metadata — `key`, `label`, `min`, `max`, `step`, control type).

The three are not type-linked. The `FIELDS` array's `key` strings must
match interface keys, but TypeScript cannot enforce it. The two
schemaless scenes (`audio-reactive`, `flow-shader`) have no parameters
at all and no tuner.

Two further smells compound the duplication:

- A `<Canvas key={params.count}>` (or composite key) invariant exists
  in three of the seven tuners but is encoded nowhere — it's a learned
  pattern that says "when this integer changes, re-mount the canvas to
  rebuild geometry." Future contributors (humans or AI) reading the
  code cannot tell the rule from the absence of the pattern in the
  other four tuners.
- Each scene file repeats a manifest-bootstrap ritual at the top:
  `import rawManifest from './manifest.json'; const meta = manifest.find(m => m.id === SCENE_ID); if (!meta) throw …`.

The `2026-05-13` `/improve-codebase-architecture` grilling session
(Candidate 5 in `docs/architecture-deepening.md`) framed this as
primarily an AI-navigability concern: a future agent renaming a param
or adding a new one would touch three places, with no type guard
catching drift, and no signal at all about the implicit remount
invariant. Drift bugs of this shape don't fail tests; they cause
silent UI breakage (a slider that does nothing, or a geometry rebuild
that never happens).

The natural deepening is a single colocated **SceneParamSchema**
declaration per tunable scene, with the params type, defaults, and
field array all derived from it. The implementation question is what
declaration mechanism to use.

`zod` is already a dependency in this repo, used by the blog
frontmatter pipeline for parsing untrusted YAML. Reaching for Zod here
is the obvious move — it's already in the bundle (for routes that
import the blog reader), it produces typed defaults from schemas, and
it would let new contributors apply a tool they already know.

This ADR records why we decided against Zod and adopted a small
in-repo DSL instead.

---

## Decision

Scene parameter schemas use a small in-repo DSL — a `defineSceneParams`
helper plus the derivation utilities `ParamsOf<S>`, `defaultsOf(S)`,
and `fieldsOf(S)` — colocated with each scene module. Zod is **not**
used for scene parameters.

A scene's schema declaration looks like:

```ts
export const SCHEMA = defineSceneParams({
    count:     { kind: 'number', default: 5500, min: 500, max: 10000, step: 500,
                 label: 'Count', remount: true },
    pointSize: { kind: 'range',  default: 0.0025, min: 0.001, max: 0.015, step: 0.0005,
                 label: 'Point size' },
    colorA:    { kind: 'color',  default: '#0c2036', label: 'Background color' },
    // …
})

export type BoidsParams      = ParamsOf<typeof SCHEMA>
export const DEFAULT_PARAMS  = defaultsOf(SCHEMA)
export const TUNER_FIELDS    = fieldsOf(SCHEMA)
```

The DSL covers exactly the three field kinds the existing tuners use:
`number`, `range`, `color`. Each field carries its UI metadata (`label`,
`min`, `max`, `step`) and an optional `remount: true` flag that promotes
the previously-implicit Canvas re-key behaviour to a first-class part
of the schema.

The two schemaless scenes (`audio-reactive`, `flow-shader`) remain
schemaless. Their absence is informative — "this scene has no
tunables" — and forcing an empty schema on them adds ceremony with no
payoff. They have no `/sandbox/scenes/:id` tuner route.

**Why an in-repo DSL is the right tool:**

1. **The job is declaration, not parsing.** Zod's design centre is
   validating untrusted input at runtime. Scene parameters are
   authored in TypeScript by us; there is no untrusted-input
   boundary. Reaching for a parser to do a declarative job mismatches
   the tool to the problem and asks readers to ignore half of what
   Zod offers.
2. **Zod doesn't model UI metadata cleanly.** Zod has `.min()` and
   `.max()`, but no `.step()`, no `.label()`, and no `remount` notion.
   These would land in `.describe()` strings or a sidecar map keyed
   off field names — exactly the kind of out-of-band coupling the
   deepening is meant to remove.
3. **Canvas bundle size matters.** The canvas subsystem is bundle-size
   sensitive (the PRD calls this out for scene loading). Zod is
   ~10 KB minified+gzipped. The DSL is ≤ 1 KB and dependency-free.
   Pulling Zod into the canvas bundle to do work it's not designed
   for is a regression on a dimension we care about.
4. **AI-readability of a 30-LOC primitive beats AI-readability of a
   library workaround.** A future agent reading
   `canvas/scenes/paramSchema.ts` understands the whole vocabulary in
   one short file. Reading Zod-with-UI-sidecars requires Zod
   knowledge + the workaround convention.

**Rejected alternatives:**

- **Use Zod.** Rejected for reasons 1–4 above. (The natural follow-up
  proposal — "build the UI metadata adapter on top of Zod" — keeps
  reason 3 unresolved and amplifies reason 1.)
- **Plain object literal with `as const satisfies SceneSchema`.**
  Leaner still (no helper at all). Rejected because the inference
  ergonomics for `defaultsOf` / `fieldsOf` benefit from the
  `defineSceneParams` identity wrapper — and the wrapper costs nothing
  at runtime.
- **Centralised schema registry (`canvas/scenes/schemas.ts`).**
  Considered during the grill; rejected in favour of colocation
  (Fork B). The schema is part of the scene's contract; separating it
  weakens locality for the agent reading a single scene file.

---

## Consequences

### Code

- A new module `canvas/scenes/paramSchema.ts` exports
  `defineSceneParams`, `ParamsOf`, `defaultsOf`, `fieldsOf`, and the
  `SceneParamSchema` / `SceneFieldDef` types.
- Each tunable scene file replaces its `*Params` interface and
  `DEFAULT_PARAMS` object with a single `SCHEMA` declaration plus
  derived `*Params` type, `DEFAULT_PARAMS` value, and `TUNER_FIELDS`
  value.
- The seven `sandbox/particles/*Tune.tsx` files collapse into one
  generic `<Tuner schema={SCHEMA} Scene={SceneComponent} />`. The
  existing `TunePanel.tsx` presentational layer survives underneath.
- The seven wrapper route files in `routes/sandbox/` and their
  per-scene entries in `App.tsx` are replaced by a single dynamic
  route `/sandbox/scenes/:id`. URLs change in a sandbox-only namespace
  (`/sandbox/particles-boids` → `/sandbox/scenes/particles-boids`);
  no production consumers.

### Tests

- `scenes.test.ts` gains: every tunable scene exports a `SCHEMA` whose
  derived `DEFAULT_PARAMS` matches the declared param shape. (Largely
  automatic via the DSL; tested anyway as a guard.)
- A new `paramSchema.test.ts` covers the DSL primitives — defaults
  extraction, field derivation, type inference behaviour. Replaces
  zero tests today (the tuners are untested).
- One unit test of `<Tuner>` covers all seven scenes' UIs via schema
  permutations.

### Docs

- `CONTEXT.md` gains three terms — **BackgroundScene**,
  **SceneParamSchema**, **Tuner** — under a new "Background scenes"
  domain section.
- `docs/architecture-deepening.md` Candidate 5 is settled by this
  ADR; the doc stays as a historical record and is not edited.

### Out of scope for this decision

- URL/JSON serialization of tuner state (e.g. shareable preset
  links). The original candidate's "Direction" included this; the
  grill cut it as YAGNI — the only serialization need today is the
  tuner's "Dump → console" button.
- Bringing the two schemaless scenes (`audio-reactive`,
  `flow-shader`) under the DSL. Their absence is signal; forcing
  empty schemas adds noise.
- Replacing Zod elsewhere in the codebase. Zod remains the right tool
  for blog frontmatter (its actual job: parsing untrusted YAML).
