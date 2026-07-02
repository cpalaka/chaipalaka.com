# Drift physics — design spec (gravity → top-down drift)

- **Tracked by:** DRAFT-010 (promotion pending; decomposition needs its own explicit go)
- **Status:** RATIFIED 2026-07-01 — adversarial review applied, both reopened items
  resolved by Chai (prose-repel scope amended per §1; Box/BoxB kept and converted to
  drift as the nested-cards demo), docs commit approved (D10).
  Review (wf_7abc7f69-08a): 46 agents — 18/18 claims checked, 36 findings →
  29 clusters → 16 confirmed + 8 accepted LOW + 5 killed; zero dropped votes/holes.
  All 24 accepted findings are folded in below.
- **Sources:** grilling session 2026-07-01 (decisions Chai-ratified); blast-radius
  survey + adversarial review of `web/src`; prototypes `prototypes/fat-tethers.html` +
  `lava-metaball.html` (feel pre-validated ~60fps); ADR-0009 / task-037 for downstream.

**Claim tags:** `[reuse]` survives unchanged · `[extend]` modified · `[new]` · `[delete]`.
**Verification:** `✓v` = verified first-hand in-session · `✓r` = confirmed by the
adversarial review (claim checks and/or skeptic panels). No unverified `✓a` marks remain.

---

## 0. Vision

All elements live on a 2D plane viewed top-down. Cards **drift gently** (Brownian
wander), **bounce off each other** (real collision), and are **draggable**. Tethers are
**pull-only ropes**: slack when close, real tension when stretched. No gravity, no
pendulum-hang, no home anchors — rest is wherever the ropes, the prose repel, and drift
leave you. This is the foundation for the WebGPU canvas layer (metaball auras task-038,
fat tethers task-039, field-warp task-041): the physics the GPU makes visible. Future
force inputs (pointer motion/clicks perturbing the drift) slot in as additional forces.

## 1. The drift-mode force model

Per tick, a non-dragged card body receives:

| Force | Mechanism | Notes |
|---|---|---|
| Brownian wander | dt-normalized random **velocity kick**: `Δv = baseAmplitude × driftScale × sqrt(dt/16.667) × rand()`, velocity-clamped | **Acceleration semantics, not raw force** — multiply by body mass at the apply site (the `tetherStiffness` convention, `Tether.ts:202-215`) so drift is mass-invariant like the prototype ✓r. dt-normalized against the 16.667ms reference tick so feel is refresh-rate-invariant (site ticks raw rAF dt clamped to 50ms, `PhysicsContext.tsx:84` → `Engine.update` ✓r); a unit test asserts wander statistics are invariant ticking at 8ms vs 33ms |
| Damping | `frictionAir` is a **registration-time body property**, mode-conditional: existing `0.005` (`BODY_FRICTION_AIR`, `PhysicsWorld.ts:66`) when gravity-dormant, `driftTuning.damping` under drift ✓r | NOT part of the tick force pass — a global change would break §3.1's dormant-path bit-identity. For HMR tuning, the drift tick re-syncs `body.frictionAir` from `driftTuning` (cheap), which is what keeps the read-at-use promise for this one knob. NaN-inversion margin (~0.2 threshold) holds either way |
| Rope pull | `Tether.applyRopeForces` `[reuse]` ✓v | pull-only past rest length; zero force when slack (`Tether.ts:197`). **Conditional** (LOW ✓r): the module applies equal *accelerations* to both ends (force = a·m per body), so a taut dynamic–dynamic pair of *unequal* masses self-propels slightly — invisible under gravity, exposed by drift. Fine while tethered pairs are same-size; if unequal-size pairs get authored (child pins!), symmetrize at build (single magnitude ± both ends) |
| Card collision | matter.js collision impulses | replaces the prototypes' crude AABB separation |
| Wall bounds | existing 4 static walls `[reuse]` ✓r `PhysicsWorld.ts:103-157` | soft bounce; frame-bar insets unchanged ✓r |
| Prose repel | `[new]` gentle outward force from the content-box rect, signed-distance falloff | **Scope amended + ratified 2026-07-01:** applies to **all non-dragged, non-dismissed card bodies** (STRUNG included), superseding Q5's "DETACHED only". Reason ✓r: a pull-only rope only *caps* distance, it never positions — without repel, a parked or word-anchored card is free anywhere in its rope disc (half of which is over the prose) and Brownian actively explores it. Repel + rope *jointly* produce every "floats just clear" pose deterministically |

Dragged cards: pointer authority as today `[reuse]`. Dismissed previews: slight random
fling + fade (§3.4) — no Brownian, no repel, removal on fade-end.

**Tick-loop / sleeping baseline** (LOW ✓r): matter sleeping is not enabled anywhere in
`web/src`, the rAF loop already runs unconditionally forever (`PhysicsContext.tsx:79-91`),
and `tick()` runs solver + per-body `onTransform` every frame — so perpetual drift adds
only the per-card force pass to an already-perpetual loop. **Matter sleeping stays OFF**
(explicit guard: sleeping bodies ignore small per-tick forces and would kill Brownian
wander and rope tugs). "Drift-settle" is operationally the *bounded-drift invariant*,
never a rest state.

## 2. Ratified decisions

- **D1 — Scope: every route converts to drift.** Per-route **Physics mode**
  `'drift' | 'gravity'`, default `'drift'`; no route declares gravity today. Gravity
  stays in the engine as a **dormant mode** (code + knobs retained). Demo routes ✓r:
  `sandbox/Strings.tsx` is the genuine gravity demo → `[delete]` (with its `App.tsx:183-188`
  route registration; the SSG prerender set shrinks accordingly). `test/Box.tsx` is
  **not** a gravity demo — it is the v2 content-box/ladder walkthrough, with a
  hero-morph twin `test/BoxB.tsx` (`/test/box-b`, wired at `App.tsx:65-80,199-216`,
  recorded as a demo surface in ADR-0007) — **ratified: keep the pair, convert to
  drift**; it stays the demo surface for the ladder and for nested cards (child pins).
  `App.tsx:241`'s "404 floaty, up-gravity" comment goes stale (the 404 balloon joke
  retires with D1).
- **D2 — Motion model: edge-only drift.** No per-card home anchor, no spring-back
  (upholds the standing v2 no-spring-back principle). Layout still seeds initial
  positions; tether rest lengths seed from layout **with one derivation change**: static-
  edge parents become radial (§3.3) instead of y-projected — which *converges on* the
  glossary's own radial definition (`length = distance(parentAnchorPos, cardLayoutPos)`,
  CONTEXT.md Tether entry) ✓r. Free (DETACHED) components wander; walls bound them.
- **D3 — Ladder survives; only the dismissal exit is redesigned.** Peek placement
  `[reuse]` ✓r (`peekGeometry.ts` — pure viewport math, held preview has no body).
  Auto-park/recall trigger machine `[reuse]` ✓v — `scrollRegime.ts` is pure fold
  geometry, zero changes. Parked *pose* + KEEP pose change (§3.3). Dismissal = slight
  random fling + fade-out (§3.4); the forthcoming "melt" idea replaces the fade later.
  ENTER / hero morph untouched `[reuse]` ✓r (`nav/morph.ts` + `viewTransitionName`
  sites are CSS view-transitions, no physics dependence).
- **D4 — STRUNG / DETACHED keep their names.** Topology-derived as today. Consequences
  redefined: STRUNG = bounded drift around its static anchor; DETACHED = free wander,
  stays where left. **Resize caveat** ✓r: today any post-mount anchor change calls
  `world.setAnchor` (`CardImpl.tsx:252-258`), which teleports the body and zeroes
  velocity — under drift, every resize (including mobile URL-bar show/hide) would snap
  wanderers home, contradicting "stays where left". Drift-mode anchor-move policy:
  **translate-pair the body by the layout delta** (the existing G6 primitive,
  `PhysicsWorld.ts:239-247`), preserving wander offset + velocity (§3.1).
- **D5 — Boundaries.** Walls stay as drift bounds `[reuse]`. Content-box edges stay
  non-colliding sensors + tetherable `box-top`/`box-bottom` park handles `[reuse]` ✓r
  (sensors at `PhysicsWorld.ts:434-437`). **Prose repel** `[new]` — scope per §1
  (all non-dragged bodies; ratified).
- **D6 — Engine: matter.js retained.** Drift is configuration, not surgery. Ropes stay
  **pull-only** (`applyRopeForces` unchanged ✓v, with the equal-mass condition noted in
  §1) — preserves the slack state task-039's tension rendering needs. No push-apart:
  overlap is collision's job.
- **D7 — Tuning.** New **`physics/driftTuning.ts`** `[new]`, read-at-use: Brownian
  base amplitude (acceleration units, §1), drift damping (with the registration-time
  sync caveat, §1), prose-repel radius + strength. **Dismissal knobs stay in
  `peekTuning`** ✓r (not driftTuning — one home only): `fallMs`→`fadeMs`,
  `fallKick`→`dismissKick`, re-semanticized in place (§3.4). NOT in `physicsTuning.ts`
  (Atelier whole-file-regen gotcha). No Atelier drift axis in the initial build.
  Per-route intensity: **`driftScale`** on PageSpec (default 1); reading routes
  near-still, canvas routes livelier. **Authoring rule** ✓r: `mode` / `driftScale` are
  authored in the route component / PageSpec composition — **never in Atelier-regenerated
  `.layout.ts` files**, whose whole-file regen would silently drop them (§3.2).
- **D8 — Sweep** (approved, one qualifier added ✓r): StringLayer straight-line +
  tension styling (§3.6); spawn at layout anchor + small random velocity (§3.5);
  `prefers-reduced-motion` ⇒ `driftScale = 0` — cards still; drag and peek work;
  **existing reduced-motion pin behavior is unchanged** (ADR-0008's sim-gate: pinned
  cards freeze via `setDragging(true)` at `PinnedCard.tsx:155`, park/recall teleport
  rather than ease — drift does not revise that gate); Atelier "Re-drop" → "re-scatter".
- **D9 — Term sheet** (lands in CONTEXT.md post-approval): **Physics mode**, **Drift**,
  **Gravity (dormant)**, **Prose repel**, Strung/Detached redefinitions,
  pendulum-settle → **drift-settle**; "edge" gets an _Avoid_ (the domain noun stays
  **Tether**). Plus the four existing entries the spec materially redefines ✓r:
  **Cardinal** (becomes dormant-mode-only), **PageSpec/PageDef** (gains mode +
  driftScale, gravity demoted to optional), **Preview card** (dismissal = random fling
  + fade, removal on fade-end — no longer upward-cone + viewport-exit), **Resting
  state** (drop "gravity still decides balloons vs hanging"), and the Relationships
  bullet "PageDef owns the Cardinal gravity direction".
- **D10 — Docs order** (ratified): spec → adversarial review → fix → docs commit on
  explicit approval: CONTEXT.md + **ADR-0010** (which also stamps **ADR-0001 decisions
  1 and 6 + decision 7's rationale as superseded-in-part**, banner + pointer, mirroring
  the ADR-0002 precedent ✓r) + **PRD including the "### Modules with tests" roster**
  (rewrite the PhysicsWorld and Tether/StringLayer required-coverage entries to
  drift-mode behaviors + a dormant-gravity subset ✓r) + DRAFT-010 update.

## 3. Surface-by-surface change map

### 3.1 PhysicsWorld core — `[extend]`
- Gravity plumbing **retained** for the dormant mode ✓r: `gravityDir` (:79),
  constructor sync (:95), `setGravityDirection` (:304), cardinal→vector (:313-325),
  `syncEngineGravity` (:327-331, re-synced per tick :613). Drift routes run gravity
  `{x:0, y:0}`. Note ✓r: `syncEngineGravity` is itself a `getGravityVector()` consumer
  (the primary one); buoyancy is the only discrete *per-body* force reading it.
- `[new]` drift force pass in the tick: Brownian + prose repel (§1). Gated on the
  route's mode; **damping is the one non-tick knob** (registration-time property +
  drift-tick re-sync, §1) so the dormant gravity path stays bit-identical.
- Buoyancy `[reuse]`-dormant ✓r (`setBuoyancy` :491-501, tick force :617-623): inert
  at g=0, no route-level API deletion needed. `buoyancyForKind` (`PageSpec.ts:64-66` ✓v)
  stays.
- Word-anchor proxies `[extend]` ✓r — **not** pure reuse: `registerAnchor`
  (`PhysicsWorld.ts:215-230`) creates them `{isStatic: true}` with `isSensor`
  defaulting **false** — solid invisible 1×1 obstacles. Fine under gravity (cards hang
  ~150px away); under drift's near-word poses, cards overlap them and matter shoves
  the penetration out (an i111-class invisible-cause kick). Fix: proxies become
  **sensors** — behavior-neutral in the dormant mode (they exist only as tether parents).
- Drift-mode anchor-move policy `[new]` (D4 ✓r): `setAnchor` teleport-and-zero
  (`PhysicsWorld.ts:516-523`) is the gravity-mode behavior; drift mode translate-pairs
  by the layout delta instead (G6 primitive :239-247).
- Tick/sleeping guard: see §1 — sleeping stays OFF, loop already perpetual.

### 3.2 PageSpec / routes / layouts / Atelier layout pipeline — `[extend]`, wider than v1 of this spec
- `PageSpec.gravity: Cardinal` (required today, `PageSpec.ts:58` ✓v) becomes
  **optional**; `[new]` `mode?: 'drift' | 'gravity'` (absent ⇒ `'drift'`;
  `mode:'gravity'` + absent gravity ⇒ `'down'`). `[new]` `driftScale?: number`.
- **The gravity field is structural in a chain the first version of this map missed**
  ✓r (HIGH): `RouteLayout.gravity` is REQUIRED (`routeLayout.ts:25`) and
  `pageSpecFromLayout` (:36) copies it into PageSpec; `schemas/layout.ts` seeds
  (`:89-97`), writes (`:147`), and reads (`:192`) it; and the Atelier layout
  **write-back regenerates `.layout.ts` files whole** with `vite-plugin-atelier.ts`
  hard-requiring `gravity: z.enum(CARDINALS)` (:422) and the regen template emitting
  the gravity line (:461, :498). Blanket-dropping the field breaks typecheck and the
  first arrange-mode write-back re-inserts or rejects. `[extend]` all three:
  `RouteLayout.gravity` becomes optional; the zod field optional; schema/regen
  emit/seed gravity **only when present**. Route files drop their `gravity:`
  declarations (`Home.tsx:20` up, `NotFound.tsx:10` up, `Lifelog/Stuff.layout.ts:5`,
  `Flash.tsx:114,124`, `FlashDetail.tsx:70`, `test/Box.tsx:39` ✓r).
  `mode`/`driftScale` are authored route-side, never in `.layout.ts` (D7).
- `usePageDef` `[extend]` ✓r (`usePageDef.ts:7-14`): sets mode (+ gravity when
  declared), resets on unmount.
- `CardSpec.trail` (`PageSpec.ts:34` ✓v) survives mechanically; chain-route scenography
  feel-checked at build. `Resting` `[reuse]` — orthogonal to physics mode.

### 3.3 Pin subsystem — `[extend]`
- `scrollRegime.ts` `[reuse]` ✓v — no changes (pure `wordCenterY` vs fold).
- `wordAnchor.ts` translate-pair + `recursion.ts` subtree carry `[reuse]` ✓r.
- Poses: parked = short rope to the `box-top`/`box-bottom` handle; word-anchored =
  rope to the word proxy; root-pin fallback (`PinnedCard.tsx:129` ✓r) and ambient
  offsets (`ambientPins.ts:47` `{0,150}`, `Home.tsx:36` `{40,-150}` ✓r) → authored
  near-word offsets, any direction. **The pose is produced by rope + prose repel
  jointly** (§1, §6.1) — the rope alone only caps distance ✓r.
- **Radial edge wiring — the full rule** ✓r (the "just use the card branch" shorthand
  was wrong): the card branch measures to the parent **body center**, and edge bars are
  centered at box-center-x, 30px inside the box (`PhysicsWorld.ts:394-404`) — applied
  literally, every parked rope would converge diagonally on the bar's midpoint.
  `[extend]` `wireTetherFor` (`Tether.ts:32-54`): for static/edge parents keep an
  `anchorA` mapping to **the edge point nearest the child at wire time** (on the
  registered edge line), then `length = radial distance from that attach point to the
  child anchor`. This replaces the y-projection (`Tether.ts:52`) and the inline
  duplicate in `parkAt` (`PinnedCard.tsx:197-201`). Covered by a §3.8 test.
- Word-wobble `[reuse]`-and-retune ✓r (`wobble.ts:36-40` velocity-driven, no gravity
  term; drive at `PinnedCard.tsx:323-334`).
- `pinTuning.parkGapPx` reinterpreted (park-rope rest clearance).

### 3.4 Peek subsystem — `[extend]`, contained
- Placement/hover/bridge/keep `[reuse]` ✓r.
- Dismissal `[extend]`: `computeFlingVelocity`'s upward cone (`peek/fling.ts` ✓v —
  system-generated, injected RNG, not a user gesture) → slight random-direction fling;
  card fades out; **removal on fade-end** replaces viewport-clearance detection
  (`CLEAR_PAD`, `PreviewCard.tsx:224-230` ✓r `[delete]`). Knobs stay in `peekTuning`
  re-semanticized ✓r: `fallMs`→`fadeMs`, `fallKick`→`dismissKick` (D7). Only consumers
  of `fling.ts` are `PreviewCard.tsx` + its test ✓v.
- `PeekStore` phase `'falling'` (`PeekStore.ts:13` ✓v) → `'dismissing'` — naming only,
  but note `PeekStore.test.ts:28,40,44` assert the phase string (§3.8 ✓r).

### 3.5 Spawn — `[delete]` + `[new]`
- `[delete]` the gravity-aligned spawn offset: `card/spawnOffset.ts` + its test,
  `physicsTuning.spawnOffsetPx`, Atelier schema field + binding
  (`schemas/physics.ts:43,71` ✓v).
- Full consumer sweep is **10 files** ✓v✓r (v1 of this spec said 9 and omitted the most
  load-bearing one): the module + test, **`CardImpl.tsx` (:10 import; :59-65 is the
  actual spawn-position computation the `[new]` drift spawn replaces)**, prop plumbing
  in `Card.tsx` / `CardRegistry.tsx` / `Page.tsx`, `PageSpec.ts:40` (`CardSpec.spawnOffset`
  — author-less ✓r, delete field + plumbing), `physicsTuning.ts`, `schemas/physics.ts`,
  `vite-plugin-atelier.ts`.
- `[new]` drift spawn: materialise at layout anchor with a small random initial
  velocity ("the route breathes in").

### 3.6 Rendering — StringLayer `[extend]`
- Slack sag bezier follows `getGravityVector` ✓v (`StringLayer.tsx:27-52`). Drift:
  straight lines always; slack/taut drives stroke width + opacity — the SVG preview of
  task-039's tension language. **The sag branch is gated on Physics mode, not deleted**
  ✓r — the dormant gravity mode keeps its renderer half (and the PRD roster's sag test
  remains testable against the dormant path).
- **Fallback wording corrected** ✓r: StringLayer is the **no-WebGPU (JS-enabled)
  fallback**. It cannot render without JS (client rAF loop over effect-registered
  bodies; at SSG time the physics layer is empty). The no-JS surface remains ADR-0004's
  prose `NoJsFallback` — task-039 AC#6's no-JS half points there. Drift does not change
  the ADR-0004 prerender/no-JS story (physics stays effect-only).
- **Tension API for task-039** ✓v: `TetherView` exposes binary `slack` only
  (`Tether.ts:60,175`). `[extend]` add continuous tension to `list()`; **pin the exact
  formula** (recommend `tension = max(0, dist − length) / length`, with the
  `slackFactor`-boundary behavior stated) and note ✓r that `list()` allocates fresh
  view objects per call (`Tether.ts:156-175`) — task-039 AC#4's "no per-frame alloc"
  is satisfiable GPU-buffer-side (as StringLayer tolerates churn today) or needs a
  snapshot-into-caller-buffer variant; 039 decides at build, but the spec says so.

### 3.7 physicsTuning + Atelier physics axis — `[extend]`
- Stay: `tetherStiffness`, `slackFactor`, `flingVelocityScale`, `flingPauseMs`;
  `gravityY`, `buoyancyGain` (dormant-mode knobs).
- `[delete]` the 9 fossil v1-transition constants (`exitKick`, `pourIn*` ×4,
  `stringCutHardCeilingMs`, `anchorSlideDurationMs`, `decoupledOverlapMs`,
  `reducedMotionMs`) — ✓v zero runtime consumers; a **4-file sweep**
  (`physicsTuning.ts`, `schemas/physics.ts`, `vite-plugin-atelier.ts` + its test);
  write-back round-trip test must stay green.
- Atelier physics axis "world" group (Gravity/Buoyancy sliders, `schemas/physics.ts:21-28`
  ✓r) demoted to dormant-mode presentation (build-time call). Layout-axis gravity
  select: see §3.2's pipeline entry. "Re-drop" → "re-scatter" (`redropKey.ts`,
  `PhysicsAxis.tsx:38` ✓r — remount-key mechanism, gravity-agnostic).

### 3.8 Tests
- **Rewrite** ✓r: `PhysicsWorld.test.ts` (gravity/direction/buoyancy/settle suites —
  shrink to dormant-mode coverage, not deletion), `PhysicsWorld.contentBox.test.ts`
  (gravity-dependent assertions :44,:62,:122,:170), `PhysicsWorld.wordAnchor.test.ts`
  (gravity-dependent suite ✓r — missed by v1 of this list), `usePageDef.test.tsx`,
  `fling.test.ts`, `vite-plugin-atelier.test.ts` (fossil + gravity-emission changes).
- **Rewrite — the ≥8 files v1 missed** ✓r: `Home.test.tsx:21-22` + `NotFound.test.tsx:59-60`
  + `Flash.test.tsx:54` (assert `pageDef.gravity`), `routeLayout.test.ts:24,33` +
  `layoutOverride.test.tsx:15,33,56` (gravity mapping/override → optional + mode),
  `PeekStore.test.ts:28,40,44` (phase `'falling'` rename), `ambientPins.test.ts` (~:51,
  hang-below default), `FrameBar.test.tsx:182` (stale "gravity is always on per ADR
  0001" test name ✓r). The list is still declared **non-exhaustive**: each build slice
  ends with `grep -rE "gravity|falling|spawnOffset" '*.test.*'`.
- **Keep** ✓r: `scrollRegime.test.ts` (unchanged — pure fold machine), `wordAnchor`,
  `recursion`, `CardImpl.test.tsx` drag/fling (its ceiling/floor wiring cases follow
  §3.3's radial rule).
- **`Tether.test.ts` is `[extend]`, not keep** ✓r: rope mechanics stay; **add the
  continuous-tension test** (slack ⇒ 0/clamped floor; monotonic past rest length;
  `slackFactor`-boundary consistency) pinning the exact formula 039 consumes, and the
  radial-edge-wiring cases (attach point = nearest edge point, not bar center).
- **`sectionLayout.ts` is runtime-dead code** ✓v✓r: `partitionChain`/`partitionPageDef`
  have zero non-test importers (BlogIndex replaced the v1 chain in task-026; Flash
  builds from `layoutTuning` directly). `[delete]` module + test as v1 dead code
  (verify-at-build that no planned consumer exists), rather than "partial rewrite".
- `[new]`: drift force pass (frozen-body determinism via injected RNG), dt-invariance
  of Brownian statistics (§1), mass-invariance of drift (§1), prose-repel falloff
  (incl. box corners + inside-the-rect case), radial edge wiring, drift-settle
  bounded-drift invariant, drift-mode anchor-move translate-pair (D4).

## 4. Downstream consumers

- **task-038 (auras)** — per-frame card body positions via shared ref: exists. Gate
  lifts when this ships.
- **task-039 (fat tethers)** — per-tether endpoints + continuous tension: §3.6's
  `TetherView` extension is the API (with the allocation note). StringLayer survives
  as its **no-WebGPU (JS-enabled)** fallback; the no-JS half of its AC#6 is
  `NoJsFallback` (ADR-0004).
- **task-041 (field-warp)** — live card rects: same bridge as 038.
- **DRAFT-009 remaining walk** — unaffected; #2 lava toy becomes buildable on real
  drift physics after this ships.

## 5. Non-goals (parked, not designed here)

- Home **composition** redesign (open-canvas nav-graph web vs today's box + ambient
  pins) — physics converts under D1; composition is its own future decision.
- Pointer-force interaction — future force input.
- "Melt" dismissal treatment — replaces the fade later; trigger plumbing already fits.
- Atelier drift axis — follow-up if HMR tuning drags.
- Force-directed layout, multi-parent tethers, persisted pins (task-028) — unchanged.

## 6. Open items

**Resolved by Chai 2026-07-01** (were review-reopened): (1) prose-repel scope = all
non-dragged, non-dismissed bodies (§1); (2) `test/Box.tsx` + `test/BoxB.tsx` = keep,
convert to drift — the standing demo surface for the ladder and nested cards.

**Build-time:**
1. Feel constants (amplitude, damping, repel radius/strength, per-route driftScale) —
   tuned solo in-session (visual/feel AC ⇒ never a background wave).
2. Chain routes (`/stuff/flash`) drift feel + `trail` scenography.
3. Parked/word-pose polish + wobble retune (§3.3), on top of the repel+rope mechanism.
4. Box/BoxB drift conversion polish — the pair doubles as the nested-cards (child-pin)
   demo; keep the walkthrough copy accurate.
5. Atelier dormant-gravity presentation (§3.7).
6. `PeekStore` phase rename scope (§3.4).
7. If unequal-mass tethered pairs get authored, symmetrize rope forces (§1).

## 7. Sequencing sketch (input to decomposition — NOT approved, needs its own go)

Roughly: (1) engine slice — mode plumbing (PageSpec + RouteLayout + zod/regen), drift
force pass (dt-normalized, mass-invariant), damping sync, sensor-ized word proxies,
radial edge wiring, anchor-move policy, driftTuning, tests; (2) ladder conversion — pin
poses on repel+rope, peek dismissal fade, spawn, ambient offsets, phase rename; (3)
rendering + cleanup — StringLayer mode-gated sag + tension styling, TetherView tension,
fossil/spawnOffset/sectionLayout/demo-route deletions, Atelier demotions; (4) route
conversion + feel pass — per-route driftScale, chains, reduced-motion wiring, in-session
tuning. Decompose formally at promotion time.
