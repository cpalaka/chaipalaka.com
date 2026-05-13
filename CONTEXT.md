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

### Architecture

**BodyForceSource**:
A small adapter interface (`getPosition`, `getMass`, `isStatic`,
`applyForce`) that abstracts a body source for modules that need to read
body state and push forces without depending on matter.js. The seam used
by **Tether** to apply rope forces; the same seam primitives use to drive
bodies during route transitions.
_Avoid_: BodyDriver (reserve that name for the primitives-side superset
when it grows mutators like `setDragging`/`setPosition`), engine adapter.

## Relationships

- A **Card** has at most one **Tether** to a parent; multiple **Card**s can
  tether to the same parent — the topology is a forest of trees.
- A **Card** is either **Strung** or **Detached**; the state is fully
  determined by whether its **Tether** chain reaches a static body.
- A **PageDef** owns the **Cardinal** gravity direction and the full
  **Tether** topology for its route — neither is mutated at runtime.
- **Tether** depends on **BodyForceSource**; `PhysicsWorld` satisfies that
  interface.

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
