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
declared per route in its **PageDef**. Magnitude is constant (`0.7`).
_Avoid_: direction (too generic), vector (gravity isn't authored as a
vector — the cardinal compiles to one).

**PageDef**:
A route's declarative spec — the **Cardinal** gravity for the route, the
list of **CardSpec**s, the tether topology, and (for transitions /
sections) per-route metadata.
_Avoid_: page config, route schema, layout def.

**CardSpec**:
A single **Card**'s declaration within a **PageDef**: its `id`, `kind`,
layout anchor, optional `parent` (another `cardId` or `'ceiling'` /
`'floor'`), and content.
_Avoid_: card config, card data.

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
The per-route ambient visual rendered behind the foreground physics —
typically a Three.js / `@react-three/fiber` component drawing particles
or a shader, sometimes a CPU-driven geometric pattern. Declared per
route in its **PageDef** (and on the **BackgroundGallery** controller)
by `id`; the renderer (`BackgroundCanvas`) lazy-loads the scene's
module on first use. Each scene module exports a runtime object
carrying `id`, the `Component`, `accentColor`, `fallbackColors`
(a pre-WebGL paint), and `fallbackPng` (a static image for SSG /
no-WebGL fallback). Tunable scenes additionally export a
**SceneParamSchema**.
_Avoid_: shader (not all scenes are shader-based — `geometric-voronoi`
is CPU-driven); background (ambiguous with CSS); scene (collides with
Three.js's own `Scene` object — say **BackgroundScene** when domain is
ambiguous).

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

### Architecture

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
- **"PhysicsCard"** is a code identifier (the React component) and is
  *not* the canonical domain term — **Card** is.
