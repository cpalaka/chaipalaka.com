# chaipalaka.com — domain language

The shared vocabulary for designing and refactoring this site. Terms are
pulled from `PRD.md` and the `docs/adr/` decisions as they sharpen during
grilling sessions; this file grows lazily — only terms that have actually
come up in conversation belong here.

Architectural vocabulary (Module, Interface, Seam, Adapter, Depth,
Leverage, Locality) lives in
`.claude/skills/improve-codebase-architecture/LANGUAGE.md` and is shared
across projects — don't duplicate it here.

## Language

### Foreground physics

**Card**:
A self-contained foreground element with a body in the physics world, a
React component for its DOM, and an entry in the route's **PageDef**.
_Avoid_: tile, block, widget, panel.

**Tether**:
The rope-shaped relationship between a parent (another **Card** or a
static body — ceiling or floor) and a child **Card**. Authored
declaratively in a **PageDef**; never created or destroyed by user action.
Its length is derived from the layout — `length = distance(parentAnchorPos, cardLayoutPos)`.
_Avoid_: string (used only for the rendered SVG line), constraint, link,
rope (used as a behavioural adjective, not the noun for the thing itself).

**Rope** (adjective):
The behaviour a **Tether** exhibits — slack when the child is closer than
the tether's length, pull-only when at length, never extending past it.
"Rope semantics" = these three rules together.
_Avoid_: spring (different behaviour — oscillates), rigid (different
behaviour — fixed distance).

**Strung**:
A **Card** whose **Tether** chain reaches a static body (ceiling or floor)
transitively. Hangs or floats at its taut position. One of two **Card**
states.
_Avoid_: locked, pinned, anchored (those imply runtime user control).

**Detached**:
A **Card** with no **Tether** to a static body. Falls or floats freely
under **Cardinal** gravity, bounded by floor/ceiling/side walls.
_Avoid_: free, floating, loose.

**Cardinal**:
One of `'down' | 'up' | 'left' | 'right'`. The fixed gravity direction
declared per route in its **PageDef**. Magnitude comes from
**PhysicsTuning** (`gravityY`, default `0.7`).
_Avoid_: direction (too generic), vector (gravity isn't authored as a
vector — the cardinal compiles to one).

**PageDef**:
A route's declarative spec — the composition of a **PageSpec** and a
**TransitionSpec**. Routes author the intersection; subsystems read
only the half they need.
_Avoid_: page config, route schema, layout def.

**PageSpec**:
A route's declared content — its **Cardinal** gravity, **CardSpec**
list, and optional **SectionsConfig**. The "what the route is" half
of a **PageDef**. Physics-side consumers (`PhysicsPage`, `usePageDef`,
`partitionPageDef`) read **PageSpec**, never the transitions half.
_Avoid_: page config, route schema.

**TransitionSpec**:
A route's declared transition behaviour — preferred exit/enter
**Primitive**s and sibling-axis order. The "how the route moves" half
of a **PageDef**. The **Director** and `dispatch()` read the
transitions half off a **PageDef** when computing a **TransitionPlan**.
_Avoid_: transition config, transition def.

**CardSpec**:
A single **Card**'s declaration within a **PageDef**: its `id`, `kind`,
layout anchor, optional `parent` (another `cardId` or `'ceiling'` /
`'floor'`), and content.
_Avoid_: card config, card data.

**RouteLayout**:
The data half of a scatter route's **PageSpec** — `{ gravity, cards: [{
id, kind, parent, anchor }] }` authored in a sibling
`web/src/routes/<route>.layout.ts` file and zipped with the route's card
content via `pageSpecFromLayout`. An anchor is either a viewport-fraction
literal `{ fx, fy }` (the drag-editable, regenerable form) or a closure
`(viewport) => Vec2` (legal for computed layouts — the `/` placeholder's
letters). Fraction-only layout files are pure data literals: the
Atelier's write-back regenerates them whole, never via AST surgery.
_Avoid_: layout config, arrangement (the Atelier axis that *edits* a
**RouteLayout**, not the data itself), layout def.

### Card lifecycle

The three states below combine orthogonally with **Strung** / **Detached**
— a **Card** has both a lifecycle state and a tether state at all times.

**Spawning** (lifecycle):
A **Card** state from `register` until first activation. The body exists
in the **PhysicsWorld** but its position is not yet authoritative, and
the rendered article is hidden (`visibility:hidden`). Two paths out:
either the **Director** calls `activate(id)` after a transition
**Primitive** has positioned the body, or — when the registry is not
**Armed** — its default policy schedules `activate(id)` on the next
microtask.
_Avoid_: loading, pending, hidden (hidden is a render consequence of
the state, not the state itself).

**Active** (lifecycle):
A **Card** state where the body is autonomous in the **PhysicsWorld**
(subject to gravity, **Tether** forces, drag input) and the rendered
article is visible. The default state after **Spawning** resolves.
_Avoid_: mounted, alive.

**Exiting** (lifecycle):
A **Card** state set by the **Director** when a route transition begins.
The card survives its React component's unmount: the registry refuses
to delete an **Exiting** card until the **Director** explicitly calls
`release(id)`. Visible and still in the **PhysicsWorld** throughout.
_Avoid_: leaving, unmounting.

**CardLifecycle**:
The three-state machine `spawning → active → exiting → (released)`.
State transitions are owned by the **Director** and the registry alone;
routes and components do not set lifecycle states directly. Illegal
transitions (e.g. `active → spawning`, double-activate) throw.
_Avoid_: card phase, card mode.

**Armed** (registry state):
The registry is **Armed** from when the **Director** calls `arm()` at the
start of a route transition until it calls `disarm()` after releasing
exiting cards. While **Armed**, the registry does *not* auto-activate
**Spawning** cards — the **Director** owns activation timing via
**Primitive**s. While not **Armed**, `register()` schedules `activate(id)`
on the next microtask (default policy, used on initial page load).
_Avoid_: in-transition (drift), busy.

### Background scenes

**BackgroundScene**:
The eager metadata identifying a per-route ambient visual rendered
behind the foreground physics — `{ id, accentColor, fallbackColors,
fallbackPng }`. Carries no Component reference: the actual paint
(typically a Three.js / `@react-three/fiber` module, sometimes a
CPU-driven geometric pattern) is lazy-loaded by `BackgroundCanvas`
via the scene's registry entry. The metadata is what every caller
that isn't actively painting consumes — the **BackgroundGallery**
controller listing scenes for the settings menu, the SSG fallback
`<img src={fallbackPng}>`, the `--color-accent` CSS write — none of
those need the Component, and lazy-loading nine modules at app start
to populate the settings menu would defeat the canvas bundle-size
discipline.

The companion structure is the **SceneRegistry**: each scene's
**BackgroundScene** metadata is paired with a typed `loader: () =>
Promise<{ Scene, SCHEMA? }>` in one canonical module
(`canvas/scenes/registry.ts`). Tunable scenes additionally export a
**SceneParamSchema**.
_Avoid_: shader (not all scenes are shader-based — `geometric-voronoi`
is CPU-driven); background (ambiguous with CSS); scene (collides with
Three.js's own `Scene` object — say **BackgroundScene** when domain is
ambiguous).

Within the **SceneRegistry**, every **BackgroundScene** must have a
unique `id`; the registry's `SCENE_REGISTRY` const is a flat list and
the **BackgroundGallery** throws at construction if duplicate ids are
ever supplied.

**SceneRegistry**:
The single canonical module (`canvas/scenes/registry.ts`) that pairs
every scene's **BackgroundScene** metadata with a typed lazy `loader`,
discriminated on `tunable: true | false`. A `tunable: true` entry's
loader returns `Promise<{ Scene, SCHEMA: SceneParamSchema }>`; a
`tunable: false` entry's loader returns `Promise<{ Scene }>`. The
discriminant lets the **Tuner** route enumerate tunable scenes
eagerly without triggering any lazy-loads, and the type system
catches drift between a scene's `tunable` flag and whether its module
actually exports a SCHEMA. Replaces the prior shape where scene
identity, metadata, loader paths, and schema were sprawled across
`manifest.json`, `canvas/scenes/index.ts`, `canvas/scenes/tunable.ts`,
and `BackgroundCanvas.sceneLoaders` — each with its own stringly-typed
id list and no compile-time link to the others.
_Avoid_: scene manifest (drift from the retired `manifest.json`),
scene index (drift from the retired `canvas/scenes/index.ts`).

**SceneParamSchema**:
The colocated declarative source of truth for a **BackgroundScene**'s
tunable parameters. One declaration produces the scene's params type,
its default values, and the UI field definitions consumed by the
**Tuner**. Includes a per-field `remount` flag that captures the
otherwise-implicit invariant "this field requires the host `<Canvas>` to
re-mount when it changes." Schemaless scenes (e.g. `audio-reactive`,
`flow-shader`) carry no schema at all — the absence is informative,
meaning "this scene has no tunables," and they have no **Tuner** route.
_Avoid_: params config, tuner spec, param schema (drops the **Scene**
qualifier and collides with Zod's "schema" connotation that **Scene
ParamSchema** explicitly does not adopt).

**Tuner**:
The generic sandbox UI that renders a **SceneParamSchema** as live
controls bound to a single **BackgroundScene** instance. Lives in
`sandbox/`, reachable only from the dynamic route
`/sandbox/scenes/:id`. Drives the host `<Canvas>` remount key from
schema fields flagged `remount: true`. Distinct from the per-route
ambient renderer (`BackgroundCanvas`) — the **Tuner** is a development
tool, not a production surface.
_Avoid_: tune panel (drift from the existing `TunePanel` visual layer,
which may survive underneath the **Tuner** as a presentational
component); control panel (collides with the retired `ControlsPanel`).

### Atelier

**TuningSchema**:
The Atelier's declarative DSL for tunable values — a superset of
**SceneParamSchema** living in the same module
(`canvas/scenes/paramSchema.ts`): the three scene field kinds plus
`enum`, `boolean`, and `group` (a nested sub-schema). One `defineTuning`
declaration produces the values type (`ValuesOf`), the defaults
(`defaultsOf`), and the field descriptors the Atelier widgets
(`atelier/widgets.tsx`) auto-render (`fieldsOf`). The DSL stays in
production code so the dev-only Atelier imports prod code, never the
reverse — the prod-bundle guard (`web/src/__tests__/bundle-splitting.test.ts`)
depends on that direction. See
`docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md`.
_Avoid_: param schema (the scene-specific three-kind subset keeps the
**SceneParamSchema** name), tuning config, widget schema.

**AtelierStore**:
The Atelier's working-state holder (`atelier/atelierStore.ts`) — a
**Controller** in contract (`get`/`subscribe`/mutators, React-agnostic;
"store" is the ratified spec term, an accepted exception to the
**Controller** _Avoid_ list). Holds per-axis working values, per-axis
**Baseline**s, and named **Working set**s; axes are flat string keys
(`tokens.base`, `tokens.dark`, `tokens.light`, `physics`, `chain`,
`layout.<route>`) whose field model derives from each axis's
**TuningSchema**. Persisted
under `chaipalaka.atelier` — except **Baseline**s, which re-derive from
source every load. Per-field dirty is always computed (working vs.
**Baseline**), never stored.
_Avoid_: atelier state (vague), tuning store, store (unqualified).

**Working set**:
A named snapshot of every axis's working values —
`{ tokens: {base, dark, light}, physics, chain, layout: {<route>} }` under
the **AtelierStore**'s flat axis keys (the spec's original `{dark, light}`
tokens shape gained `base` when task-005 ratified the **Base token** /
theme-token split, 2026-06-09). Switching sets re-applies every live
binder instantly: the A/B/N comparison story. Saving and switching are
explicit; edits after a save do not flow into the snapshot, and dirty
stays measured against the **Baseline**, never against the active set.
_Avoid_: preset (implies shipped defaults), profile, variant.

**Base token**:
A tunable custom property declared only at `:root` in `tokens.css` —
card chrome, typography scale, spacing — identical in both themes. Lives
on the `tokens.base` axis (always live-applied regardless of active
theme; written back as a `:root`/dark edit), unlike theme tokens (the
palette), which live per-theme on `tokens.dark` / `tokens.light` and
apply only while their theme is active. V1 exclusions from the Tokens
axis (ratified 2026-06-09): `--color-accent` (BackgroundGallery writes
it inline per scene — a live binder would fight it), shadows and rgba()
tokens (no widget kind fits), font families/weights.
_Avoid_: global token (suggests a scope mechanism CSS doesn't have
here), shared token, dark token (base tokens are written via the dark
record but are not dark-specific).

**Baseline**:
An axis's current *source* values — tokens read via `getComputedStyle`
per theme when that theme becomes active in the panel; physics/chain/
layout imported from their data modules. Reconciliation rule on refresh
(write-back + HMR, or a hand edit): clean fields track the new
**Baseline**; dirty fields keep their working values. After a write-back
the regenerated source equals the working values, so reconciling clears
every dirty flag.
_Avoid_: defaults (schema defaults are the stale-data fallback, not the
**Baseline**), original values, source of truth (everything in `docs/`
claims that).

**Write-back target**:
A file the Atelier's dev-serve-only endpoint (`POST /__atelier/write`,
`web/src/atelier/vite-plugin-atelier.ts`) may modify — a hard whitelist:
`tokens` (value-only rewrite of `tokens.css`; light values land in BOTH
light blocks), `physics` (whole-file regen of `physicsTuning.ts`),
`chain` (whole-file regen of `layoutTuning.ts`), `layout` (whole-file
regen of a scatter route's `.layout.ts`). Writes are
all-or-nothing: one unmatched property or invalid payload rejects the
whole request with files untouched. Editing a mirrored token
(`--font-body`/`--font-mono` ↔ `fonts.ts`; `--card-padding`/`--card-gap`
↔ `BlogIndex.measure.ts`) returns **mirror warnings** — v1 warns, never
auto-edits the TS side.
_Avoid_: save target, write endpoint (the endpoint is the mechanism; the
target is the whitelisted file).

### Architecture

**PhysicsTuning**:
The single flat data literal (`web/src/physics/physicsTuning.ts`) holding
every physics/transition feel constant — gravity magnitude, buoyancy gain,
tether stiffness, slack factor, fling, spawn offset, transition timings.
Governed by the **read-at-use** rule: consumers read `physicsTuning.x` at
the moment of use (per tick for gravity/stiffness, per event for
fling/kick/timings), never capture it at construction — this is what lets
the Atelier physics axis act on a running world. Tests import from the
module; they never copy its literals.
_Avoid_: config (too generic), constants file (implies capture-at-import
is fine — it isn't).

**LayoutTuning**:
The chain-layout analog of **PhysicsTuning** — the single flat data
literal (`web/src/layout/layoutTuning.ts`) holding the chain constants
(chain gap/top, nav card dims, nav insets), read-at-use by
`sectionLayout` partitioning and the chain routes' builders. One
difference from physics: chain layout is pull-based, so the module
carries a notify/subscribe pair — the Atelier chain binding mutates the
literal then notifies, and subscribed chain routes (`/blog`,
`/stuff/flash`) rebuild and re-partition. Tests import from the module;
they never copy its literals (the pre-task-009 local copies had already
drifted: Flash's CHAIN_TOP was 100 vs the source 80).
_Avoid_: chain config, sectionLayout constants (the retired home).

**BodyForceSource**:
A small adapter interface (`getPosition`, `getMass`, `isStatic`,
`applyForce`) that abstracts a body source for modules that need to read
body state and push forces without depending on matter.js. The seam used
by **Tether** to apply rope forces.
_Avoid_: engine adapter.

**BodyDriver**:
The primitives-side superset of **BodyForceSource**: per-handle reads
(`getPosition`, `getVelocity`, `getSize`, `getBuoyancy`, `isStatic`,
`getGravityVector`), per-handle mutators (`setPosition`, `setVelocity`,
`setDragging`, `setSensor`), and atomic tether ops (`detachTetherOf`,
`attachTether`) that take/return a **TetherSpec**. The seam **body
primitives** drive bodies through during route transitions, free of
matter.js types and free of world identity (no `ceilingHandle`/
`floorHandle`; `isStatic(parent)` carries that knowledge instead).
`PhysicsWorld` is one adapter; the test fake is the other.
_Avoid_: engine adapter, world facade.

**TetherSpec**:
The snapshot of a **Tether** — `{parent, child, length, anchorA?}` —
used by **body primitives** to capture-and-restore a card's tether
around a kinematic drive. Distinct from the **Tether** itself: the
spec is plain data and re-applying it produces an equivalent tether.
_Avoid_: tether config, tether record (records exist in `PhysicsWorld`
internals).

**Director**:
The single coordinator that arms route transitions on navigation,
advances **Card**s through their **CardLifecycle**, dispatches
**Primitive**s, and releases exiting cards. Today: `TransitionDirector.tsx`.
The **Director** is the only thing that drives lifecycle transitions
other than the registry's default-policy auto-activate on initial mount.
_Avoid_: transition manager (drift), router controller (routing belongs
to react-router-dom; the **Director** consumes location changes, doesn't
own routing).

**CardLayer**:
The React layer mounted once at app root (inside `CanvasLayout`) that
renders every active **Card** via the `CardRegistry`. Survives route
unmount, which is how an exiting **Card** keeps painting through its
exit **Primitive** after the route that registered it has gone. The
matching DOM probe (`[data-physics-layer]`) retains the older name for
selector-stability reasons; the React component is `CardLayer`.
_Avoid_: card list, card portal, physics layer (the prior name; misread
the component as a layer of physics rather than a layer of cards).

**Primitive**:
A named animation step that runs during a route transition. Each is a
`PrimitiveStep` — a per-tick function returning whether it has
completed. Composed by the **Director** per the route's **PageDef**.
Two families share the type:

- **Body primitive** — drives **Card** bodies through the
  **BodyDriver** seam. Examples: `pour-in-drop`, `string-cut-drop`,
  `anchor-slide`.
- **DOM primitive** — drives a DOM property without touching bodies.
  Example: `cross-fade` (opacity on an HTMLElement).

_Avoid_: step (too generic), animation (used for non-route animations
like FrameBar idle).

**Controller**:
A domain-owned object exposing mutable state to the rest of the app
through a uniform contract: a `getX(): T` reader for the current value,
a `subscribe(cb: (next: T) => void): () => void` listener registration
that fires synchronously on every change, and any domain-specific
mutators. React-agnostic — every **Controller** must be constructible
and unit-testable without React in scope. Production examples:
`BackgroundGallery` (active background scene), `FrameEdgeController`
(frame-bar edge selection), `ThemeController` (light/dark/system).
Consumed by React through a single bridge hook (`useController`), never
by re-implementing the subscribe ritual per call site.
_Avoid_: store (drifts toward Redux/Zustand connotations the site does
not adopt), service (backend-ish), manager (vague), context
(React-coupled — a **Controller** can outlive any React tree).

**Lazy singleton**:
The SSR-safe module-level cache pattern used to hold one **Controller**
instance per browser session: a `let instance: T | null` at module
scope plus a `getInstance()` that constructs on first call, guarded so
SSG/SSR (no `window`, no `localStorage`) doesn't throw. Lives in the
React-side hook file that exposes the **Controller** to components,
never inside the **Controller** module itself — the **Controller** is
the unit of behaviour; the singleton is the unit of session-scoped
identity, and the two should not be welded.
_Avoid_: global (suggests ambient mutable state with no owner), module
state (true but uninformative), instance hack.

**No-JS fallback**:
The static, prerendered content a canvas route ships for no-JavaScript
users and non-executing crawlers — section nav + prose (read from the
synchronous content source, not the effect-driven `CardRegistry`) + the
default scene's background gradient. Marked `data-nojs-fallback` and
hidden once JS hydrates via a `.no-js` class-swap on `<html>` (set in
`index.html`, stripped by an inline head script before first paint, gated
in `base.css`). A parallel read-only view: it touches none of the
**Card** / `CardRegistry` / **Director** machinery, and exists to give
canvas routes a readable floor without prerendering physics. See
ADR-0004.
_Avoid_: SSR fallback (there is no SSR runtime — it is prerendered),
noscript block (the gate is a CSS class-swap, not `<noscript>`),
no-JS mode (it is not a mode the live app switches into).

### Text and measurement

**Font**:
A named typographic specification — `{ family, size, weight, lineHeight }`
plus a derived canvas font-string. Declared as a const value (e.g.
`FONT_BODY`, `FONT_CARD_TITLE`) and imported by callers; not registered
under a string key. The **Font**'s `family`, `size`, and `weight` must
match the corresponding CSS token in `tokens.css` so that **TextMeasure**
predicts the same dimensions the browser will paint — a drift test
asserts this agreement in CI.
_Avoid_: font key (string-keyed lookup is the older registry shape, now
deprecated), font spec (drift from the existing **CardSpec** /
**SceneParamSchema** pattern; **Font** is a value, not a "spec").

**TextMeasure**:
The pre-paint typographic measurement primitive: given **Font** + text +
max width, returns the dimensions a paint would produce, without
touching the DOM. Built on `@chenglou/pretext`'s canvas-based
measurement; the implementation library is an internal detail of the
**TextMeasure** module. Today's surface is `measure(text, font, maxWidth)
→ { width, height, lines }`; future growth (variable-width line
streaming for prose around physics-card obstacles, particle-glyph
preparation for transitions) lives behind the same seam.
_Avoid_: pretext (leaks the implementation library into the domain),
font registry (the older shape, retired by this term — see drift bug
in `text/registry.ts` discovered 2026-05-13).

### v2 — gwern × physics ladder (Portal/Pocket)

These describe the **v2** interaction model (the link ladder + content box). They
supersede the v1 "page is a card swarm" framing for content routes. Full design:
`docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md` (ADRs 0005–0008).

**Content box**:
The fixed, solid, scrollable prose surface that is the protagonist of a v2 route —
gwern-style dense reading content, floating over the background shader, with
**Card**s in a foreground plane above it. Fixed DOM (not a physics body), but its
edges participate in physics (cards collide with / tether to them). Its rectangle
is registered into the **PhysicsWorld** as four static walls via `setContentBox`
(top/bottom are tetherable handles, the **Edge-anchored** regime; `'box-top'` /
`'box-bottom'` **ParentRef**s resolve to them); on resize the box recentres and
its edge-anchored cards are translate-paired with their edge (ADR-0006 G6).
_Avoid_: panel, reader pane, article (the box is the whole reading surface, not
one element in it).

**Reading substrate**:
The generic, presentational gwern-style reading shell — a sticky table of
contents beside a prose column (`ReadingSubstrate`, the `.reader` grid). Effect-
free so it prerenders as the no-JS floor. Generalised out of the blog plain
reader so the **Content box** and the `/blog/:slug/read` plain reader share one
substrate; the box supplies the chrome (fixed, solid, scrollable), the substrate
supplies the reading layout.
_Avoid_: reader (ambiguous with the route), plain reader (that is one consumer of
the substrate, not the substrate).

**Ladder**:
The single v2 interaction: any meaningful link is one object at three escalating
commitment levels — **peek** → **keep** → **enter**. "Sub-page vs hanging card" is
not authored; it is how far the visitor pushed the same object.
_Avoid_: popup system, link menu.

**Peek / Keep / Enter**:
The three **Ladder** rungs. **Peek** = hover/tap spawns an ephemeral **preview
card**. **Keep** = pin it into a persistent **pinned card**. **Enter** = navigate
to the page (**hero morph**).
_Avoid_: open/expand/pin-unpin as the canonical verbs — these three are the
vocabulary.

**Portal**:
A **Ladder** link that has a destination page — the full rung (peek → keep →
enter).
_Avoid_: Type-1; internal-link (a Portal may be internal or, later, an authored
external annotation).

**Pocket**:
A **Ladder** link with no page — a footnote / aside / definition whose **Card**
*is* the content (peek → keep, no enter). Its static floor (task-021) is a real
inline disclosure: an authored GFM footnote (`[^1]`) is rewritten by
`rehype-pocket-footnotes` into a `<details class="pocket" data-pocket-id="…">`
(zero-JS toggle, native SR disclosure semantics). The `data-pocket-id` + the
`.pocket__body` content is the **card-lift hook** — the DOM seam the **Ladder**
reads to lift a Pocket into a **preview/pinned card**. The same plugin runs in the
page MDX pipeline and the RSS generator, so one footnote renders one disclosure
everywhere.
_Avoid_: Type-2; footnote (a footnote is one kind of Pocket; the term is broader);
tooltip.

**Preview card**:
The **peek**-state **Card**: ephemeral, stiff-anchored beside its source word,
side-positioned, dismissed by a physical fall. Not yet a full-physics toy.
_Avoid_: popup, tooltip, hovercard.

**Pinned card**:
A kept **preview card** — now a persistent full-physics **Card** strung to its
source word via a **runtime-created Tether** (the first user-created tether; v1's
were authored per **PageDef**, see ADR-0001 §3 / ADR-0006).
_Avoid_: locked card (no padlock; ADR-0001), saved card.

**Word-anchored / Edge-anchored**:
The two anchor regimes of a **pinned card**. **Word-anchored** = tethered to its
source word, tracking scroll. **Edge-anchored** = tethered to a top/bottom viewport
edge (the parked state, reusing the ceiling/floor parent **Tether**).
_Avoid_: floating/fixed (ambiguous), docked.

**Auto-park / Recall**:
The two regime transitions. **Auto-park** = the automatic word→edge transition when
a **pinned card**'s source word scrolls past the fold (it parks at the edge the
word exited through). **Recall** = the manual edge→word return: scroll the word
back (it keeps a persistent highlight), click it to bring the **Card** home with a
hysteresis ease. Recall is never automatic — no yo-yo.
_Avoid_: collapse/dock (for auto-park), restore/un-park (for recall).

**Bonded trio**:
The visually-linked unit of a **pinned card**: source word + **Tether** + **Card**.
Hovering any of the three highlights all three.
_Avoid_: group, cluster.

**Hero morph / Physical default**:
The two v2 navigation transitions (replacing the retired v1 transition system,
ADR-0007). **Hero morph** = a clicked **Card** expands/reflows into the destination
**content box**, via the **browser-native View Transitions API** driven by
`react-router`'s `viewTransition` Link prop + `useViewTransitionState` (the
task-019 spike chose this over `react@experimental` `<ViewTransition>` and the
`canvas/flip.ts` FLIP — see ADR-0007); unsupported browsers fall back to a plain
client nav. **Physical default** = a lightweight directional box slide/crossfade
for chrome-originated nav (frame bar, back/forward, direct URL) where there is no
source **Card** to morph from.
_Avoid_: page transition (too generic); the retired primitive names (anchor-slide,
pour-in-drop, etc.).

## Relationships

- A **Card** has at most one **Tether** to a parent; multiple **Card**s can
  tether to the same parent — the topology is a forest of trees.
- A **Card** is either **Strung** or **Detached**; the state is fully
  determined by whether its **Tether** chain reaches a static body.
- A **PageDef** owns the **Cardinal** gravity direction and the full
  **Tether** topology for its route — neither is mutated at runtime.
- **Tether** depends on **BodyForceSource**; `PhysicsWorld` satisfies that
  interface.
- A **Card**'s **CardLifecycle** (Spawning / Active / Exiting) is
  orthogonal to its tether state (**Strung** / **Detached**). Both apply
  at all times. A card can be `Spawning + Strung`, `Active + Detached`,
  etc.
- The **Director** owns **CardLifecycle** transitions: `register →
  spawning` by default; `activate(id)` for `spawning → active`;
  `markExiting(id)` for `active → exiting`; `release(id)` for `exiting →
  (deleted)`. The registry rejects `requestUnregister` on **Exiting**
  cards — only `release(id)` deletes them. This is what lets cards
  survive their route's React unmount.

## Load-bearing invariants

- **I-1: a Spawning Card never paints.** The renderer marks **Spawning**
  cards `visibility:hidden`. The **Director** must position the body
  before calling `activate(id)`. Was previously enforced by RAF ordering
  and a prose comment in `PhysicsCardImpl`; now a property of the
  lifecycle state and asserted directly in tests.
- **I-2: Exiting survives unmount.** When a route navigates away, the
  **Director** marks every **Active** **Card** as **Exiting** *before*
  React commits the unmount (`useLayoutEffect`, not `useEffect`).

## Example dialogue

> **Dev:** "If I drag a **Strung Card** way off its taut position and let
> go, does it return to its layout anchor?"
> **Designer:** "No — there's no spring back. The **Card** pendulum-settles
> at the taut position the **Tether** allows. The layout anchor was just
> where the **Card** started; once the world is running, gravity and the
> **Tether** decide where it rests."

> **Dev:** "Can I make a **Card** swing between two parents like a
> hammock?"
> **Designer:** "No. One parent per **Card**. Multi-parent is a future
> extension if it earns its keep."

## Flagged ambiguities

- **"String"** has been used for three things in older notes:
  (1) the **Tether** itself,
  (2) the rendered SVG line (`<StringLayer>`),
  (3) the rope behaviour of a **Tether**.
  Resolved: **Tether** is the relationship; the SVG line is the **string
  layer rendering of a Tether**; the behaviour is **rope** (adjective).
