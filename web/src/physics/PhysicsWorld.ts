import Matter from 'matter-js'
import { Tether } from './Tether'
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

const GRAVITY_Y = 0.7
const BODY_FRICTION_AIR = 0.005
const FLOOR_THICKNESS = 60
const BUOYANCY_GAIN = 1.5

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

    readonly floorHandle: PhysicsHandle
    readonly ceilingHandle: PhysicsHandle
    readonly tether: Tether

    constructor(opts: PhysicsWorldOptions) {
        this.engine = Matter.Engine.create()
        this.world = this.engine.world
        this.engine.gravity.x = 0
        this.engine.gravity.y = GRAVITY_Y // always on, default down

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

    unregister(handle: PhysicsHandle): void {
        const reg = this.registrations.get(handle)
        if (!reg) return
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
        switch (dir) {
            case 'down':
                this.engine.gravity.x = 0
                this.engine.gravity.y = GRAVITY_Y
                break
            case 'up':
                this.engine.gravity.x = 0
                this.engine.gravity.y = -GRAVITY_Y
                break
            case 'left':
                this.engine.gravity.x = -GRAVITY_Y
                this.engine.gravity.y = 0
                break
            case 'right':
                this.engine.gravity.x = GRAVITY_Y
                this.engine.gravity.y = 0
                break
        }
    }

    getGravityVector(): Vec2 {
        return { x: this.engine.gravity.x, y: this.engine.gravity.y }
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

    tick(dtMs: number): void {
        // 1. Apply balloon buoyancy — per-tick force opposing gravity, scaled to match gravity force units
        const g = this.getGravityVector()
        const gravScale: number =
            (this.engine.gravity as { scale?: number }).scale ?? 0.001
        for (const reg of this.registrations.values()) {
            if (reg.isStatic || reg.buoyancy !== 'balloon') continue
            Matter.Body.applyForce(reg.body, reg.body.position, {
                x: -g.x * reg.body.mass * gravScale * BUOYANCY_GAIN,
                y: -g.y * reg.body.mass * gravScale * BUOYANCY_GAIN,
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
