# The Atelier — in-situ design-iteration tool

- **Status**: approved (brainstorm session 2026-06-04)
- **Owner**: Chai
- **Implementation tracking**: backlog.md kanban board in this repo — tasks 001–010, milestone
  "Atelier v1" (seeded 2026-06-05 from this spec via the to-issues breakdown, approved by Chai;
  see `backlog task list --plain`). Do NOT route this work through GitHub issues or writing-plans.

## Context & goal

chaipalaka.com v2 keeps the existing concepts (physics cards on strings, balloons, per-route
topology) and route structure. What v2 changes is the *design*: card look & feel, gravity/physics
feel, and per-route card arrangement. Before committing to a direction, Chai wants a visual way to
tweak these one at a time and compare alternatives.

Existing surfaces were assessed and found insufficient in scope (not polish):

- `/sandbox/cards` — chrome specimen preview; only `colorMode` + `frameEdge` tweakable; all card
  look-and-feel baked into `web/src/sandbox/cards/tokens.css`
- `/sandbox/scenes/:id` — real schema-driven Tuner, but GL background scenes only; persistence is
  `console.log`
- `/sandbox/strings` — hardcoded topology demo, zero runtime controls

No surface tunes card dimensions/typography/borders, gravity, tether feel, or per-route
arrangement via UI. The Atelier fills that gap.

## Decisions (ratified during brainstorm)

| Question | Decision |
|---|---|
| Venue | **In situ** — overlay on real production routes, not a lab |
| Output | **Write-back to source** via a dev-only Vite middleware endpoint |
| V1 axes | **Tokens, physics, arrangement** (GL background scenes deferred) |
| Arrangement per route family | **Scatter routes**: drag-to-place anchors. **Chain routes**: tune layout constants — no per-card drag |
| Comparison | **Named working sets** (localStorage), applied live; winner written back |
| Approach | **In-repo, built on existing primitives** (generalized `SceneParamSchema` DSL, `subscribable`/`persistentMap`, Vite-plugin idiom) — no new dependencies |
| Form factor | **Docked side inspector** (full-height right panel, tabs per axis, collapsible) |

## Architecture

Dev-only overlay living in `web/src/atelier/`.

**Mounting**: `CanvasLayout` mounts `<AtelierGate>`: renders `null` in prod (`import.meta.env.DEV`
guard + `React.lazy` so the chunk never ships); in dev shows a corner toggle that opens the
inspector on whatever route is active. Existing `/sandbox/*` surfaces stay untouched in v1; retire
redundant ones only after the Atelier proves itself.

**Four moving parts**:

1. **`TuningSchema`** — generalization of the `SceneParamSchema` DSL
   (`web/src/canvas/scenes/paramSchema.ts`, ADR-0003). New field kinds: `enum`, `boolean`, `group`
   (existing: `number`, `range`, `color`). Every tunable — token fields, physics fields,
   chain-layout fields — is declared in a schema; panel widgets are auto-generated from it (same
   pattern as `web/src/sandbox/particles/TunePanel.tsx`).
2. **`AtelierStore`** — a `subscribable` (`web/src/state/subscribable.ts`) holding working state:
   current values per axis, per-field dirty flags vs. source baselines. Persisted via
   `persistentMap` under key `chaipalaka.atelier`.
3. **Live binders** — per axis, the code that makes a change visible immediately (see axis
   sections).
4. **Write-back endpoint** — `vite-plugin-atelier.ts`, a dev-serve-only middleware (same idiom as
   `serveLocalAssets` / `vite-plugin-feeds` in `web/vite.config.ts` and `web/src/blog/`):
   `POST /__atelier/write {target, payload}`.

**Data flow**: schema renders panel → panel edits AtelierStore → binders apply live → iterate →
save as working set and/or `POST /__atelier/write` → source files change → Vite HMR reloads →
overlay reconciles (baselines refresh, dirty flags clear).

**Safety**: the endpoint writes only to a hard whitelist of files *designed* for write-back (see
below). It refuses anything else. Git is the undo button.

## Axis 1 — Tokens (card look & feel)

- **Schema**: hand-curated `atelier/schemas/tokens.ts` mapping tunable custom properties in
  `web/src/styles/tokens.css` to widgets with ranges — e.g. card border width `range(0, 8, 0.5)`,
  accent `color()`. Groups: palette, card chrome, typography, spacing. Curated by hand because CSS
  parsing yields values but not ranges/grouping/judgment.
- **Theme-aware**: `tokens.css` declares dark at `:root` and light **twice** (media query +
  `[data-theme=light]`). The panel's theme switch drives the *production* `ThemeController`
  (`web/src/controls/theme.ts`) — no parallel theming mechanism (the cards-sandbox mistake, not
  repeated). Working state stores values per theme; edits apply to the active theme.
- **Live binder**: `documentElement.style.setProperty(token, value)` — inline style wins over all
  stylesheet declarations; revert = `removeProperty`. Dirty-only: clean fields carry no inline
  property, so stylesheet theming keeps working underneath.
- **Base/theme split** (ratified with task-005, 2026-06-09): card chrome, typography, and spacing
  tokens are declared only at `:root` — they live on a third axis `tokens.base`, always applied,
  written back as `:root` edits; only the palette is per-theme (`tokens.dark` / `tokens.light`).
  V1 excludes `--color-accent` (BackgroundGallery writes it inline per scene), shadows and rgba()
  tokens (no widget kind), and font families/weights (string stacks; mirrored).
- **Write-back**: value-only replacement of matched declarations in `tokens.css`, preserving
  comments/order. Light values are written into **both** light blocks — the dual-declaration
  foot-gun handled in one place.
- **Mirror warnings**: some tokens have TS mirrors — `--font-body`/`--font-mono` ↔
  `web/src/text/fonts.ts` (pretext measurement); card padding ↔
  `web/src/routes/blog/BlogIndex.measure.ts` (`CARD_PADDING` et al., "must match the CSS").
  The plugin carries a mirrors map; writing a mirrored token returns warnings the panel surfaces.
  V1 warns, does not auto-edit TS; existing drift tests (`fonts.test.ts`) are the backstop.

## Axis 2 — Physics (gravity & feel)

- **Enabling refactor — `web/src/physics/physicsTuning.ts`**: consolidate the scattered feel
  constants into one data literal:
  - from `PhysicsWorld.ts`: `GRAVITY_Y 0.7`, `BUOYANCY_GAIN 1.5`
  - from `Tether.ts`: `TETHER_STIFFNESS 1.75e-5`, `SLACK_FACTOR 0.98`
  - from `flingImpulse.ts`: fling scale `16`; from `spawnOffset.ts`: offset `20`
  - transition timings from `web/src/transitions/` primitives: `POUR_IN_BASE_DELAY_MS 1000`,
    stagger `80`, `tween 600`, `anchorSlide 700`, `EXIT_KICK 10`, etc.
- **Read-at-use rule**: consumers read `physicsTuning.x` (or the dev subscribable wrapping it) at
  the moment of use — per tick for gravity/stiffness, per event for fling/kick — never captured
  into a closure at construction. This is what makes sliders act on a *running* world.
  `SLACK_FACTOR` stays single-sourced so rope physics and StringLayer sag drawing move together.
- **Replay**: one button, **re-drop** — key-bump the card layer so spawn → fall → pendulum-settle
  replays under current values. Transition timings need no replay button: navigating is the replay.
- **Slider curation**: matter.js response is nonlinear (memory: "near-zero" stiffness is `1e-9`,
  not `1e-4`). `tetherStiffness` gets a log-scale slider; all ranges are curated to the regime
  that works, not mathematically pretty bounds.
- **Write-back**: regenerate `physicsTuning.ts` whole (data literal — no AST work). Tests must
  import from the module, never copy literals, so retuning cannot strand stale expectations.
- Gravity *direction* is per-route and lives in the arrangement axis, not here.

## Axis 3 — Arrangement (per-route)

**Enabling refactor — layout as data.** Each scatter route's layout moves to a sibling data file
`web/src/routes/<route>.layout.ts`:

```ts
export const lifelogLayout = {
    gravity: 'down',
    cards: [
        { id: 'books', kind: 'lifelog', parent: 'ceiling', anchor: { fx: 0.22, fy: 0.3 } },
        // …
    ],
} satisfies RouteLayout
```

`anchor` becomes `{ fx, fy } | (viewport) => Vec2` — fractions resolved by a helper; closures stay
legal for computed layouts. Route components zip layout with their `cardContent` exactly as today.
Write-back = regenerate the whole file from working state. **No AST surgery anywhere.**

- **Arrange mode** (Layout tab toggle) flips pointer semantics: normal drag = physics fling;
  arrange drag = move the card's **anchor** (body re-tethers and pendulum-settles onto the new
  rest position; live fraction readout). Selecting a card shows a mini-inspector: `parent`
  (`ceiling | floor | <card> | detached`) and `kind`. Route-level: gravity-direction select —
  **data-layout routes only** (chain routes build their PageDef in code at runtime; their gravity
  has no write-back target and stays code-edited in v1).
- **Chain routes** (`/blog`, `/stuff/flash`): no per-card drag — honest to the computed layout.
  The Layout tab exposes chain constants (`CHAIN_GAP 60`, `CHAIN_TOP 80`, `NAV_CARD_W 180`,
  `NAV_CARD_H 56`, insets — currently in `web/src/layout/sectionLayout.ts`) from a new
  `layoutTuning.ts` data file with the same live-binder + write-back treatment. Changing a value
  re-partitions the chain live.
- **Scope fences**:
  - Add/remove cards stays in code (a card needs `cardContent`, not just a spec).
  - The current `/` placeholder keeps its computed letter anchors (not drag-editable); the v2
    home gets designed *with* the Atelier as a data layout from birth.

## Working sets

A working set is a named snapshot of **everything tunable**:
`{ tokens: {base, dark, light}, physics, chain, layout: {<route>} }`. Stored via `persistentMap`
(`chaipalaka.atelier`). Switching sets re-applies every live binder instantly — this is the
A/B/N comparison story. Baseline = current source values (tokens via `getComputedStyle`, read
per theme when that theme becomes active in the panel; physics/chain/layout imported from their
data modules). Per-field dirty = diff vs. baseline; per-field and per-axis reset.

## Write-back endpoint

`vite-plugin-atelier.ts`, dev-serve only (absent from builds): `POST /__atelier/write` with a hard
whitelist of targets:

| target | file | method |
|---|---|---|
| `tokens` | `web/src/styles/tokens.css` | value-only replacement; both light blocks kept in sync |
| `physics` | `web/src/physics/physicsTuning.ts` | whole-file regeneration |
| `chain` | `web/src/layout/layoutTuning.ts` | whole-file regeneration |
| `layout` | `web/src/routes/<route>.layout.ts` | whole-file regeneration |

All-or-nothing: the tokens rewriter must match every requested property or the write is rejected
untouched; regen targets validate generated source before writing. Responses carry mirror
warnings. Failed write → panel shows the error; working state and files untouched.

## UI — docked side inspector

Full-height right-docked panel, tabs per axis (Tokens / Physics / Layout), collapsible to reclaim
viewport width. Working-set controls (set picker, save, write-back button with dirty indicator)
live in the panel footer. Widgets are auto-generated from `TuningSchema`. A C-style full-width
frame drawer can be added later without rework — the panel is a shell around the same widgets.

## Testing

Every consequential piece is a pure function, tested in the repo's existing idiom:

- **Rewriter/codegen**: string-in → string-out fixtures (`tokens.css` rewrite keeps both light
  blocks in sync; layout codegen round-trips: generate → import → deep-equal). Pattern: pure
  exports from the plugin, like `buildRss` in `vite-plugin-feeds`.
- **Schema extensions** (`enum`/`boolean`/`group`): `defaultsOf`/`fieldsOf` tests alongside
  `paramSchema.test.ts`.
- **`AtelierStore`**: set switching, dirty-diffing, baseline reconciliation.
- **Read-at-use**: a `PhysicsWorld` test asserting a mid-simulation `gravityY` change affects the
  next tick.
- **Prod-bundle guard**: a second marker string + bundle-splitting test (existing pattern:
  `web/src/lib/canvas-only-marker.ts` + `web/src/__tests__/bundle-splitting.test.ts`) proving no
  Atelier code ships in production chunks.

## Out of scope (v1)

- GL background scenes axis (fold the existing Tuner into the Atelier later — the shared DSL makes
  this natural)
- Side-by-side split-screen comparison of working sets
- Adding/removing cards from the tool
- Auto-editing TS mirrors of tokens (warn-only in v1)
- Retiring `/sandbox/*` surfaces (only after the Atelier proves itself)

## Implementation handoff

Work is tracked on the **backlog.md** kanban board in this repo (decomposed 2026-06-05 into tasks
001–010, numbering matching the seams below; one deviation: the chain write-back target moved
from seam 6 to seam 9, which creates `layoutTuning.ts`). Natural seams:

1. `TuningSchema` extensions (enum/boolean/group) + widget components
2. `physicsTuning.ts` refactor (read-at-use) — independently valuable
3. Layout-as-data refactor for scatter routes — independently valuable
4. `AtelierStore` + working sets
5. `AtelierGate` + inspector shell + Tokens axis (live binder first, then write-back)
6. `vite-plugin-atelier` endpoint + rewriters/codegen
7. Physics axis panel + re-drop
8. Arrange mode (drag anchors, mini-inspector, gravity select)
9. Chain constants (`layoutTuning.ts`) + live re-partition
10. Prod-bundle guard test

The two refactors (2, 3) are prerequisites for their axes and are mergeable on their own — good
first tasks.
