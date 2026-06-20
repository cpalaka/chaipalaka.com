import Matter from 'matter-js'
import { Tether } from './Tether'
import { physicsTuning } from './physicsTuning'
import type { BodyForceSource } from './BodyForceSource'
import type { BodyDriver, TetherSpec } from './BodyDriver'

export type Cardinal = 'down' | 'up' | 'left' | 'right'

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
    private preTick = new Set<(dtMs: number) => void>()
    private contentBox: {
        top: ContentBoxEdge
        bottom: ContentBoxEdge
        left: ContentBoxEdge
        right: ContentBoxEdge
    } | null = null

    readonly floorHandle: PhysicsHandle
    readonly ceilingHandle: PhysicsHandle
    readonly tether: Tether

    constructor(opts: PhysicsWorldOptions) {
        this.engine = Matter.Engine.create()
        this.world = this.engine.world
        this.syncEngineGravity() // always on, default down

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
            { frictionAir: BODY_FRICTION_AIR },
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
     */
    registerAnchor(pos: Vec2): PhysicsHandle {
        const body = Matter.Bodies.rectangle(pos.x, pos.y, 1, 1, {
            isStatic: true,
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

    // Read-at-use: gravity is derived from physicsTuning.gravityY on every
    // call (and re-synced into the engine each tick), never captured at
    // construction, so a mid-simulation tuning change takes effect on the
    // next tick.
    getGravityVector(): Vec2 {
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
    }

    /**
     * Register, move, or clear the v2 content box as a rectangle of static
     * physics walls. The box is fixed DOM (not a simulated body), but its four
     * edges are static collision walls and its top/bottom edges are tetherable
     * parents (the edge-anchored regime — reusing the ceiling/floor branch in
     * `wireTetherFor`). Pass `null` to remove it.
     *
     * Box edges are viewport-fixed, so this fires on mount and on resize, never
     * on scroll. On a resize move, edge-anchored cards are translate-paired with
     * their edge so the body-relative tether anchor does not yank them
     * (guardrail G6 / the i111 regression — see {@link updateEdge}). The box is
     * a fixed pixel size, so only its position changes; size-responsive boxes
     * are a later slice's concern.
     */
    setContentBox(rect: Rect | null): void {
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

    // Add one static edge bar. With an `anchor` it is registered (tetherable);
    // without, it is collision-only (no handle), like the persistent side walls.
    private addEdge(center: Vec2, size: CardSize, anchor?: Vec2): ContentBoxEdge {
        const body = Matter.Bodies.rectangle(
            center.x,
            center.y,
            size.width,
            size.height,
            { isStatic: true },
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
        reg.anchor = { ...anchor }
        // Always teleport — static bodies snap immediately; dynamic bodies reposition on resize
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
