import Matter from 'matter-js'
import { Tether } from './Tether'
import { physicsTuning } from './physicsTuning'
import { driftTuning } from './driftTuning'
import { driftImpulse, nextImpulseDelay, proseRepelForce } from './drift'
import type { BodyForceSource } from './BodyForceSource'
import type { BodyDriver, TetherSpec } from './BodyDriver'

export type Cardinal = 'down' | 'up' | 'left' | 'right'

// The route's physics model (spec §3.2 / ADR-0010). `drift` is the site
// default (top-down Brownian wander + prose repel, engine gravity {0,0});
// `gravity` is the retained dormant mode. Absent-on-a-PageSpec ⇒ drift is
// resolved at the route boundary (`usePageDef`), not here — the world
// constructor defaults to `gravity` so the dormant path stays bit-identical.
export type PhysicsMode = 'drift' | 'gravity'

export interface Vec2 {
    x: number
    y: number
}

export interface CardSize {
    width: number
    height: number
}

export interface Viewport {
    width: number
    height: number
}

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export interface PhysicsWorldOptions {
    viewport: Viewport
    insets?: { top: number; bottom: number }
    // Physics model. Defaults to `gravity` (the dormant mode) so direct
    // construction stays bit-identical to the pre-drift engine; the app sets
    // `drift` via `usePageDef`. Tests pass `drift` to exercise the force pass.
    mode?: PhysicsMode
    // Injectable RNG for the Brownian drift kick — defaults to `Math.random`;
    // tests inject a seeded generator for deterministic drift.
    rng?: () => number
}

export type PhysicsHandle = number

export interface BodyState {
    x: number
    y: number
    rotation: number
}

export interface RegisterOptions {
    onTransform?: (state: BodyState) => void
}

interface Registration {
    body: Matter.Body
    anchor: Vec2
    isStatic: boolean
    onTransform?: (state: BodyState) => void
    width: number
    height: number
    buoyancy: 'heavy' | 'balloon'
    id?: string
    // Run-and-tumble (spec §1): ms until this card's next drift impulse fires.
    // Seeded with a random phase in `register()` so cards desync; decremented by
    // dtMs each drift tick. Only dynamic card bodies carry it (static/sensor
    // bodies are skipped in the drift pass), hence optional.
    nextImpulseMs?: number
}

// One edge of the v2 content box's static-wall rectangle. Top/bottom edges are
// registered (so they have a tetherable `handle`); side edges are collision-only.
interface ContentBoxEdge {
    body: Matter.Body
    handle?: PhysicsHandle
}

const BODY_FRICTION_AIR = 0.005
const FLOOR_THICKNESS = 60

export class PhysicsWorld implements BodyForceSource {
    private engine: Matter.Engine
    private world: Matter.World
    private _floor: Matter.Body
    private _ceiling: Matter.Body
    private _leftWall: Matter.Body
    private _rightWall: Matter.Body
    private nextId: PhysicsHandle = 1
    private registrations = new Map<PhysicsHandle, Registration>()
    private byId = new Map<string, PhysicsHandle>()
    private gravityDir: Cardinal = 'down'
    private mode: PhysicsMode
    private driftScale = 1
    private rng: () => number
    private preTick = new Set<(dtMs: number) => void>()
    private contentBox: {
        top: ContentBoxEdge
        bottom: ContentBoxEdge
        left: ContentBoxEdge
        right: ContentBoxEdge
    } | null = null
    // The live content-box rect (spec §1 prose repel reads it each drift tick);
    // mirrors `setContentBox`, null when no box is registered.
    private contentBoxRect: Rect | null = null

    readonly floorHandle: PhysicsHandle
    readonly ceilingHandle: PhysicsHandle
    readonly tether: Tether

    constructor(opts: PhysicsWorldOptions) {
        this.engine = Matter.Engine.create()
        this.world = this.engine.world
        this.mode = opts.mode ?? 'gravity'
        this.rng = opts.rng ?? Math.random
        this.syncEngineGravity() // drift ⇒ {0,0}; gravity ⇒ the cardinal

        const { width, height } = opts.viewport
        const top = opts.insets?.top ?? 0
        const bottom = opts.insets?.bottom ?? 0
        const hw = FLOOR_THICKNESS / 2

        // Floor — dynamic cards fall onto it; balloon cards tether to it
        this._floor = Matter.Bodies.rectangle(
            width / 2,
            height - bottom + hw,
            width,
            FLOOR_THICKNESS,
            { isStatic: true },
        )
        Matter.Composite.add(this.world, this._floor)
        const floorId = this.nextId++
        this.registrations.set(floorId, {
            body: this._floor,
            anchor: { x: width / 2, y: height - bottom },
            isStatic: true,
            width,
            height: FLOOR_THICKNESS,
            buoyancy: 'heavy',
        })
        this.floorHandle = floorId

        // Ceiling — heavy cards hang from it; upward-gravity balloon cards fall to it
        this._ceiling = Matter.Bodies.rectangle(
            width / 2,
            top - hw,
            width,
            FLOOR_THICKNESS,
            { isStatic: true },
        )
        Matter.Composite.add(this.world, this._ceiling)
        const ceilingId = this.nextId++
        this.registrations.set(ceilingId, {
            body: this._ceiling,
            anchor: { x: width / 2, y: top },
            isStatic: true,
            width,
            height: FLOOR_THICKNESS,
            buoyancy: 'heavy',
        })
        this.ceilingHandle = ceilingId

        // Side walls — invisible collision boundaries
        this._leftWall = Matter.Bodies.rectangle(
            -FLOOR_THICKNESS / 2,
            height / 2,
            FLOOR_THICKNESS,
            height + 2 * FLOOR_THICKNESS,
            { isStatic: true },
        )
        this._rightWall = Matter.Bodies.rectangle(
            width + FLOOR_THICKNESS / 2,
            height / 2,
            FLOOR_THICKNESS,
            height + 2 * FLOOR_THICKNESS,
            { isStatic: true },
        )
        Matter.Composite.add(this.world, [this._leftWall, this._rightWall])

        this.tether = new Tether(this)
    }

    private register(
        anchor: Vec2,
        size: CardSize,
        opts: RegisterOptions = {},
    ): PhysicsHandle {
        const body = Matter.Bodies.rectangle(
            anchor.x,
            anchor.y,
            size.width,
            size.height,
            // Damping is a registration-time body property, mode-conditional
            // (spec §1): drift uses driftTuning.damping, gravity keeps 0.005.
            // The drift tick re-syncs this from tuning; setMode re-applies it to
            // existing bodies so registration order vs mode-set doesn't matter.
            {
                frictionAir:
                    this.mode === 'drift'
                        ? driftTuning.damping
                        : BODY_FRICTION_AIR,
            },
        )
        Matter.Composite.add(this.world, body)
        const id = this.nextId++
        this.registrations.set(id, {
            body,
            anchor: { ...anchor },
            isStatic: false,
            onTransform: opts.onTransform,
            width: size.width,
            height: size.height,
            buoyancy: 'heavy',
            // Random initial phase ∈ [0, mean) so cards don't fire in sync (spec
            // §1). Read-at-use for the recurring interval; this seed is one-time.
            nextImpulseMs: driftTuning.impulseIntervalMs * this.rng(),
        })
        return id
    }

    registerById(
        cardId: string,
        anchor: Vec2,
        size: CardSize,
        opts: RegisterOptions = {},
    ): PhysicsHandle {
        if (this.byId.has(cardId)) {
            throw new Error(`PhysicsWorld: duplicate id "${cardId}"`)
        }
        const handle = this.register(anchor, size, opts)
        this.byId.set(cardId, handle)
        this.registrations.get(handle)!.id = cardId
        return handle
    }

    getHandleById(cardId: string): PhysicsHandle | undefined {
        return this.byId.get(cardId)
    }

    /**
     * Register a runtime **word-anchor proxy**: a tiny static body the v2
     * word-anchored regime places at a source word's viewport-space centre and
     * repositions each frame (via {@link setPosition}) to track it. Static, so
     * gravity/forces never move it — it exists only to be a tether parent that
     * follows a DOM word (ADR-0006: the first runtime-created tether topology,
     * pinning; reuses the card-parent tether kind, no `anchorA`).
     *
     * Sensor (spec §3.1): the proxy is a non-colliding static body. Under
     * gravity a card hangs ~150px away so a solid proxy never touched it, but
     * under drift's near-word poses a card overlaps the proxy and a solid one
     * would emit an i111-class invisible collision kick — behavior-neutral in
     * the dormant gravity mode.
     */
    registerAnchor(pos: Vec2): PhysicsHandle {
        const body = Matter.Bodies.rectangle(pos.x, pos.y, 1, 1, {
            isStatic: true,
            isSensor: true,
        })
        Matter.Composite.add(this.world, body)
        const id = this.nextId++
        this.registrations.set(id, {
            body,
            anchor: { ...pos },
            isStatic: true,
            width: 1,
            height: 1,
            buoyancy: 'heavy',
        })
        return id
    }

    /**
     * Translate a body by a delta **preserving its velocity** — the translate-pair
     * primitive (spike G1). Each frame the word-anchored card is shifted by the
     * same delta as its word anchor, so the rope vector stays scroll-invariant and
     * the sway survives — unlike {@link setPosition}, which teleports and zeroes
     * velocity.
     */
    translate(handle: PhysicsHandle, delta: Vec2): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        // 2-arg translate (updateVelocity omitted/falsy) shifts positionPrev with
        // position, so the move injects NO implied (Verlet) velocity — a per-frame
        // translate-pair must carry the card with its word, not accelerate it.
        // (Same call shape as the content-box edge translate-pair, G6.)
        Matter.Body.translate(reg.body, delta)
    }

    unregister(handle: PhysicsHandle): void {
        const reg = this.registrations.get(handle)
        if (!reg) return
        // Sweep tether records that reference this body. Owning React
        // components only know the original tether handle from `tether.add`;
        // primitives that detach+reattach via `detachTetherOf`/`attachTether`
        // produce a new record with a fresh handle that no component is
        // tracking. Without this sweep, those records survive past the body
        // and the next physics tick throws `unknown handle N` from
        // `Tether.applyRopeForces` / `Tether.list`.
        this.tether.removeReferencing(handle)
        Matter.Composite.remove(this.world, reg.body)
        if (reg.id) this.byId.delete(reg.id)
        this.registrations.delete(handle)
    }

    has(handle: PhysicsHandle): boolean {
        return this.registrations.has(handle)
    }

    getPosition(handle: PhysicsHandle): BodyState {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        return {
            x: reg.body.position.x,
            y: reg.body.position.y,
            rotation: reg.body.angle,
        }
    }

    getVelocity(handle: PhysicsHandle): Vec2 {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        return { x: reg.body.velocity.x, y: reg.body.velocity.y }
    }

    setPosition(handle: PhysicsHandle, position: Vec2): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        Matter.Body.setPosition(reg.body, position)
        Matter.Body.setVelocity(reg.body, { x: 0, y: 0 })
        // Synchronously notify the renderer so el.style.transform reflects
        // the new position before any state change that would unhide the
        // article. Without this, the next world.tick lags one frame and
        // pour-in's activate fires while the DOM transform still points at
        // the previous (layout-anchor) position.
        if (reg.onTransform) {
            reg.onTransform({
                x: reg.body.position.x,
                y: reg.body.position.y,
                rotation: reg.body.angle,
            })
        }
    }

    setGravityDirection(dir: Cardinal): void {
        this.gravityDir = dir
        this.syncEngineGravity()
    }

    setMode(mode: PhysicsMode): void {
        this.mode = mode
        this.syncEngineGravity()
        // frictionAir is a registration-time property (spec §1). Re-apply the
        // mode-appropriate value to existing dynamic bodies so a mode set after
        // registration (usePageDef runs in an effect) still yields correct
        // damping — and the dormant gravity path stays bit-identical at 0.005.
        const fa = mode === 'drift' ? driftTuning.damping : BODY_FRICTION_AIR
        for (const reg of this.registrations.values()) {
            if (!reg.isStatic) reg.body.frictionAir = fa
        }
    }

    getMode(): PhysicsMode {
        return this.mode
    }

    // Per-route drift intensity (spec §1 / D7); scales the Brownian amplitude.
    // Reading routes author it near 0; canvas routes livelier. Default 1.
    setDriftScale(scale: number): void {
        this.driftScale = scale
    }

    // The live per-route drift intensity. Spawn scales its "breathe-in" kick by
    // this (spec §3.5) so it inherits reduced-motion (S4 sets driftScale 0 for
    // prefers-reduced-motion, D8) and per-route liveliness for free.
    getDriftScale(): number {
        return this.driftScale
    }

    // Read-at-use: gravity is derived from physicsTuning.gravityY on every
    // call (and re-synced into the engine each tick), never captured at
    // construction, so a mid-simulation tuning change takes effect on the
    // next tick.
    getGravityVector(): Vec2 {
        // Drift routes run zero engine gravity (spec §3.1) — this one place
        // makes syncEngineGravity, buoyancy, and any consumer inert under drift.
        if (this.mode === 'drift') return { x: 0, y: 0 }
        const gy = physicsTuning.gravityY
        switch (this.gravityDir) {
            case 'down':
                return { x: 0, y: gy }
            case 'up':
                return { x: 0, y: -gy }
            case 'left':
                return { x: -gy, y: 0 }
            case 'right':
                return { x: gy, y: 0 }
        }
    }

    private syncEngineGravity(): void {
        const g = this.getGravityVector()
        this.engine.gravity.x = g.x
        this.engine.gravity.y = g.y
    }

    setViewport(vp: Viewport, insets?: { top: number; bottom: number }): void {
        const hw = FLOOR_THICKNESS / 2
        const top = insets?.top ?? 0
        const bottom = insets?.bottom ?? 0
        Matter.Body.setPosition(this._floor, {
            x: vp.width / 2,
            y: vp.height - bottom + hw,
        })
        Matter.Body.setPosition(this._ceiling, { x: vp.width / 2, y: top - hw })
        Matter.Body.setPosition(this._leftWall, { x: -hw, y: vp.height / 2 })
        Matter.Body.setPosition(this._rightWall, {
            x: vp.width + hw,
            y: vp.height / 2,
        })
        // Keep the floor/ceiling registrations' surface anchor + width in step
        // with the moved bars, or `edgeAttachPoint` clamps a resize-time tether
        // to the stale construction-time extent.
        const floorReg = this.registrations.get(this.floorHandle)
        if (floorReg) {
            floorReg.anchor = { x: vp.width / 2, y: vp.height - bottom }
            floorReg.width = vp.width
        }
        const ceilingReg = this.registrations.get(this.ceilingHandle)
        if (ceilingReg) {
            ceilingReg.anchor = { x: vp.width / 2, y: top }
            ceilingReg.width = vp.width
        }
    }

    /**
     * Register, move, or clear the v2 content box as a rectangle of static
     * physics edges. The box is fixed DOM (not a simulated body); its four edges
     * are non-colliding sensors (cards pass through the border — task-036), and
     * its top/bottom edges remain tetherable parents (the edge-anchored regime —
     * reusing the ceiling/floor branch in `wireTetherFor`). Pass `null` to
     * remove it.
     *
     * Box edges are viewport-fixed, so this fires on mount and on resize, never
     * on scroll. On a resize move, edge-anchored cards are translate-paired with
     * their edge so the body-relative tether anchor does not yank them
     * (guardrail G6 / the i111 regression — see {@link updateEdge}). The box is
     * a fixed pixel size, so only its position changes; size-responsive boxes
     * are a later slice's concern.
     */
    setContentBox(rect: Rect | null): void {
        this.contentBoxRect = rect ? { ...rect } : null
        if (rect === null) {
            if (this.contentBox) this.removeContentBox()
            return
        }
        if (this.contentBox) {
            this.moveContentBox(rect)
        } else {
            this.createContentBox(rect)
        }
    }

    get contentBoxTopHandle(): PhysicsHandle | undefined {
        return this.contentBox?.top.handle
    }

    get contentBoxBottomHandle(): PhysicsHandle | undefined {
        return this.contentBox?.bottom.handle
    }

    // The four edge bars for a box rect. Horizontal top/bottom bars sit just
    // inside the box (outer face on the box edge, surface anchor on the edge
    // line); vertical side bars are collision-only.
    private contentBoxEdges(rect: Rect) {
        const hw = FLOOR_THICKNESS / 2
        const cx = rect.x + rect.width / 2
        const cy = rect.y + rect.height / 2
        const right = rect.x + rect.width
        const bottom = rect.y + rect.height
        return {
            top: { center: { x: cx, y: rect.y + hw }, anchor: { x: cx, y: rect.y } },
            bottom: {
                center: { x: cx, y: bottom - hw },
                anchor: { x: cx, y: bottom },
            },
            left: { center: { x: rect.x + hw, y: cy } },
            right: { center: { x: right - hw, y: cy } },
            hSize: { width: rect.width, height: FLOOR_THICKNESS },
            vSize: { width: FLOOR_THICKNESS, height: rect.height },
        }
    }

    private createContentBox(rect: Rect): void {
        const g = this.contentBoxEdges(rect)
        this.contentBox = {
            top: this.addEdge(g.top.center, g.hSize, g.top.anchor),
            bottom: this.addEdge(g.bottom.center, g.hSize, g.bottom.anchor),
            left: this.addEdge(g.left.center, g.vSize),
            right: this.addEdge(g.right.center, g.vSize),
        }
    }

    private moveContentBox(rect: Rect): void {
        const cb = this.contentBox!
        const g = this.contentBoxEdges(rect)
        this.updateEdge(cb.top, g.top.center, g.top.anchor)
        this.updateEdge(cb.bottom, g.bottom.center, g.bottom.anchor)
        this.updateEdge(cb.left, g.left.center)
        this.updateEdge(cb.right, g.right.center)
    }

    // Add one static, non-colliding (sensor) edge. With an `anchor` it is
    // registered as a tether anchor (top/bottom stay pinnable); without, it has
    // no handle and — now that edges are sensors — no physical effect (left/right).
    private addEdge(center: Vec2, size: CardSize, anchor?: Vec2): ContentBoxEdge {
        const body = Matter.Bodies.rectangle(
            center.x,
            center.y,
            size.width,
            size.height,
            // Sensor: the box border is non-colliding (cards pass through it)
            // but stays a static tether anchor, so top/bottom remain pinnable —
            // auto-park is a tether/constraint, not a collision rest. task-036.
            { isStatic: true, isSensor: true },
        )
        Matter.Composite.add(this.world, body)
        if (!anchor) return { body }
        const handle = this.nextId++
        this.registrations.set(handle, {
            body,
            anchor: { ...anchor },
            isStatic: true,
            width: size.width,
            height: size.height,
            buoyancy: 'heavy',
        })
        return { body, handle }
    }

    private updateEdge(edge: ContentBoxEdge, center: Vec2, anchor?: Vec2): void {
        if (edge.handle !== undefined) {
            const dx = center.x - edge.body.position.x
            const dy = center.y - edge.body.position.y
            // G6 / i111: this edge is a static tether parent and the tether's
            // `anchorA` is body-relative, so moving the edge by (dx,dy) shifts
            // every child's rope origin by the same delta — a one-frame
            // overshoot spike that would yank the child. Translate-pair: move
            // each tethered child by the same delta so the rope vector stays
            // invariant. (Box edges move on resize only, never on scroll.)
            if (dx !== 0 || dy !== 0) {
                for (const rec of this.tether.records()) {
                    if (rec.parent !== edge.handle) continue
                    const childReg = this.registrations.get(rec.child)
                    if (childReg) {
                        Matter.Body.translate(childReg.body, { x: dx, y: dy })
                    }
                }
            }
        }
        Matter.Body.setPosition(edge.body, center)
        if (edge.handle !== undefined && anchor) {
            this.registrations.get(edge.handle)!.anchor = { ...anchor }
        }
    }

    private removeContentBox(): void {
        const cb = this.contentBox!
        for (const edge of [cb.top, cb.bottom, cb.left, cb.right]) {
            if (edge.handle !== undefined) {
                this.tether.removeReferencing(edge.handle)
                this.registrations.delete(edge.handle)
            }
            Matter.Composite.remove(this.world, edge.body)
        }
        this.contentBox = null
    }

    setBuoyancy(handle: PhysicsHandle, b: 'heavy' | 'balloon'): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        reg.buoyancy = b
    }

    getBuoyancy(handle: PhysicsHandle): 'heavy' | 'balloon' {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        return reg.buoyancy
    }

    setVelocity(handle: PhysicsHandle, velocity: Vec2): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        Matter.Body.setVelocity(reg.body, velocity)
    }

    setDragging(handle: PhysicsHandle, dragging: boolean): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        if (reg.isStatic) return
        Matter.Body.setStatic(reg.body, dragging)
    }

    setAnchor(handle: PhysicsHandle, anchor: Vec2): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        if (this.mode === 'drift' && !reg.isStatic) {
            // Drift (D4): translate-pair a dynamic card by the layout delta so a
            // resize/re-layout preserves its wander offset + velocity instead of
            // teleporting it home ("stays where left"). 2-arg translate injects
            // no Verlet velocity, so the sway survives.
            const dx = anchor.x - reg.anchor.x
            const dy = anchor.y - reg.anchor.y
            reg.anchor = { ...anchor }
            Matter.Body.translate(reg.body, { x: dx, y: dy })
            return
        }
        reg.anchor = { ...anchor }
        // Gravity / static: teleport — static bodies snap immediately; dynamic
        // bodies reposition on resize and zero velocity.
        Matter.Body.setPosition(reg.body, anchor)
        if (!reg.isStatic) Matter.Body.setVelocity(reg.body, { x: 0, y: 0 })
    }

    getAnchor(handle: PhysicsHandle): Vec2 {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        return { ...reg.anchor }
    }

    getSize(handle: PhysicsHandle): CardSize {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        return { width: reg.width, height: reg.height }
    }

    getMass(handle: PhysicsHandle): number {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        return reg.body.mass
    }

    // The body's live air-friction (damping). Mode-conditional at registration
    // and re-synced each drift tick from driftTuning (spec §1).
    getFrictionAir(handle: PhysicsHandle): number {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        return reg.body.frictionAir
    }

    isStatic(handle: PhysicsHandle): boolean {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        // The matter.js body's live isStatic flag — true for persistent static bodies
        // (ceiling/floor/walls) AND for cards currently being dragged. Tether's rope
        // force uses this to skip force application on bodies that won't integrate,
        // matching the pre-extraction tick() behaviour exactly.
        return reg.body.isStatic
    }

    applyForce(handle: PhysicsHandle, force: Vec2): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        Matter.Body.applyForce(reg.body, reg.body.position, force)
    }

    setSensor(handle: PhysicsHandle, isSensor: boolean): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        Matter.Body.set(reg.body, 'isSensor', isSensor)
    }

    isSensor(handle: PhysicsHandle): boolean {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        return reg.body.isSensor
    }

    // BodyDriver atomic tether ops. Thin wrappers over the tether sub-object
    // so body primitives can capture-and-restore (anchorSlide, pourInDrop) or
    // selectively reattach (stringCutDrop) without reaching into world.tether
    // and without leaking ceiling/floor identity through the seam.
    detachTetherOf(child: PhysicsHandle): TetherSpec | undefined {
        for (const r of this.tether.records()) {
            if (r.child !== child) continue
            const spec: TetherSpec = {
                parent: r.parent,
                child: r.child,
                length: r.length,
                ...(r.anchorA ? { anchorA: { ...r.anchorA } } : {}),
            }
            this.tether.remove(r.handle)
            return spec
        }
        return undefined
    }

    attachTether(spec: TetherSpec): void {
        this.tether.add(spec.parent, spec.child, spec.length, spec.anchorA)
    }

    /**
     * Register a callback run at the **start of every tick**, before any force is
     * applied (buoyancy/tether) and before `Engine.update`. The word-anchored
     * regime uses this to translate-pair its card to its word *before* the rope
     * force resolves (spike G1 ordering), so a fast scroll never spikes overshoot.
     * Returns an unsubscribe.
     */
    onBeforeTick(cb: (dtMs: number) => void): () => void {
        this.preTick.add(cb)
        return () => {
            this.preTick.delete(cb)
        }
    }

    tick(dtMs: number): void {
        // A zero- (or negative-) duration frame must integrate nothing. Two rAF
        // callbacks in the same millisecond feed dt=0, and matter's Verlet
        // solve on a 0-dt frame (correction / collision division by the frame
        // delta) poisons drift bodies to NaN — verified in-browser: without this
        // guard, drift routes NaN on load; with it they drift cleanly. Constant-
        // dt unit tests never feed 0, so this is a browser-only failure mode.
        if (dtMs <= 0) return

        // 0. Pre-tick steps (word-anchor translate-pair) — before any force.
        for (const cb of this.preTick) cb(dtMs)

        // 1. Apply balloon buoyancy — per-tick force opposing gravity, scaled to match gravity force units
        this.syncEngineGravity()
        const g = this.getGravityVector()
        const gravScale: number =
            (this.engine.gravity as { scale?: number }).scale ?? 0.001
        for (const reg of this.registrations.values()) {
            if (reg.isStatic || reg.buoyancy !== 'balloon') continue
            Matter.Body.applyForce(reg.body, reg.body.position, {
                x: -g.x * reg.body.mass * gravScale * physicsTuning.buoyancyGain,
                y: -g.y * reg.body.mass * gravScale * physicsTuning.buoyancyGain,
            })
        }

        // 1b. Drift force pass (spec §1) — Brownian wander + prose repel on
        //     non-dragged card bodies. Gated on drift mode; under gravity this
        //     is skipped entirely so the dormant path stays bit-identical.
        if (this.mode === 'drift') {
            const speed = driftTuning.impulseSpeed * this.driftScale
            for (const reg of this.registrations.values()) {
                // `reg.body.isStatic` (the LIVE matter flag) is true for walls,
                // edges, word proxies AND cards currently being dragged
                // (setDragging → setStatic) — exactly what drift must skip.
                if (reg.body.isStatic) continue
                // Dynamic sensors are dismissed previews (PreviewCard flings a
                // sensor body on dismiss) — spec §1 excludes them: no impulse,
                // no repel. Static sensors (box edges, word proxies) already
                // skipped above.
                if (reg.body.isSensor) continue
                // Re-sync damping from tuning each tick (read-at-use HMR — the
                // one drift knob that is a registration-time body property).
                // Clamp below the matter drag-inversion ceiling: frictionAir·
                // (dt/16.667) > 2 flips drag into amplification → NaN, which with
                // the 50ms dt-clamp is frictionAir ~0.667. This backstops an
                // S4/HMR damping mis-tune before it can NaN the world (this tick
                // re-sync runs before Engine.update, so it bounds every drift body
                // each frame). See driftTuning.ts + reference_matter_js_frictionair_inversion.
                reg.body.frictionAir = Math.min(driftTuning.damping, 0.6)
                // Run-and-tumble (spec §1, amended 2026-07-03): the card sits
                // still and coasts on damping; a per-card timer rarely fires ONE
                // velocity impulse in a random direction, then the card glides
                // straight until damping / a collision / wall / rope redirects or
                // stops it. The impulse is a direct velocity ADD (mass-invariant);
                // decrementing an ms-based interval by dtMs makes the firing rate
                // refresh-rate-invariant. driftScale scales the impulse SPEED, so
                // driftScale 0 (reduced-motion, D8) adds a zero impulse ⇒ the card
                // never moves. The authored velocity (drag-release fling, dismissal
                // kick) is never clamped here. `nextImpulseMs` is seeded for every
                // dynamic body in register(); the ?? only satisfies its optional
                // type (static/sensor bodies are skipped above).
                let remaining = (reg.nextImpulseMs ?? 0) - dtMs
                if (remaining <= 0) {
                    const impulse = driftImpulse(this.rng, speed)
                    Matter.Body.setVelocity(reg.body, {
                        x: reg.body.velocity.x + impulse.x,
                        y: reg.body.velocity.y + impulse.y,
                    })
                    remaining = nextImpulseDelay(
                        this.rng,
                        driftTuning.impulseIntervalMs,
                    )
                }
                reg.nextImpulseMs = remaining
                // Prose repel: an acceleration → force = a·mass (mass-invariant
                // pose). Rope caps distance; repel + rope jointly position cards.
                // BINARY-gated on driftScale (Chai 2026-07-03), not scaled by it:
                // driftScale 0 (reduced-motion, D8) stills repel, but any nonzero
                // drift gets FULL repel — decouples "hold cards clear of the
                // prose" from drift liveliness, so a low-drift reading route still
                // holds its cards off the text (task-042.01 re-review L1: spec §1
                // scales only wander, so gating — not scaling — repel is the fit).
                if (this.contentBoxRect && this.driftScale > 0) {
                    const a = proseRepelForce(
                        reg.body.position,
                        this.contentBoxRect,
                        driftTuning.repelRadius,
                        driftTuning.repelStrength,
                    )
                    Matter.Body.applyForce(reg.body, reg.body.position, {
                        x: a.x * reg.body.mass,
                        y: a.y * reg.body.mass,
                    })
                }
            }
        }

        // 2. Apply pull-only tether forces (rope semantics) via the Tether module.
        this.tether.applyRopeForces()

        // 3. Advance the physics engine
        Matter.Engine.update(this.engine, dtMs)

        // 4. Notify transform listeners
        for (const reg of this.registrations.values()) {
            if (!reg.onTransform) continue
            reg.onTransform({
                x: reg.body.position.x,
                y: reg.body.position.y,
                rotation: reg.body.angle,
            })
        }
    }
}

// Structural assignability check: `PhysicsWorld` must satisfy `BodyDriver`.
// If a future refactor changes a method signature so the world no longer
// matches the seam, this typecheck fails loudly and the body primitives'
// migration is forced to follow. `BodyState` is structurally assignable to
// `Vec2` (the extra `rotation` is a permitted superset).
{
    const _check: BodyDriver = null as unknown as PhysicsWorld
    void _check
}
