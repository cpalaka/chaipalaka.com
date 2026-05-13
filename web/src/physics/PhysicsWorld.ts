import Matter from 'matter-js'

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
export type LinkHandle = number
export type TetherHandle = number

export interface BodyState {
    x: number
    y: number
    rotation: number
}

export interface RegisterOptions {
    onTransform?: (state: BodyState) => void
}

export interface LinkOptions {
    length?: number
    stiffness?: number
    damping?: number
}

export interface TetherView {
    parentPos: Vec2
    childPos: Vec2
    length: number
    slack: boolean
}

interface TetherRecord {
    parent: PhysicsHandle
    child: PhysicsHandle
    length: number
    linkHandle: LinkHandle
    anchorA?: Vec2
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
const TETHER_STIFFNESS = 1.75e-5
const BUOYANCY_GAIN = 1.5

export class PhysicsWorld {
    private engine: Matter.Engine
    private world: Matter.World
    private _floor: Matter.Body
    private _ceiling: Matter.Body
    private _leftWall: Matter.Body
    private _rightWall: Matter.Body
    private nextId: PhysicsHandle = 1
    private registrations = new Map<PhysicsHandle, Registration>()
    private byId = new Map<string, PhysicsHandle>()
    private links = new Map<LinkHandle, Matter.Constraint>()
    private tethers = new Map<TetherHandle, TetherRecord>()
    private tetherChangeListeners = new Set<() => void>()
    private cachedTetherList: ReadonlyArray<TetherHandle> | null = null

    readonly floorHandle: PhysicsHandle
    readonly ceilingHandle: PhysicsHandle

    constructor(opts: PhysicsWorldOptions) {
        this.engine = Matter.Engine.create()
        this.world = this.engine.world
        this.engine.gravity.x = 0
        this.engine.gravity.y = GRAVITY_Y  // always on, default down

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
    }

    register(
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

    registerStatic(
        position: Vec2,
        size: CardSize,
        opts: RegisterOptions = {},
    ): PhysicsHandle {
        const body = Matter.Bodies.rectangle(
            position.x,
            position.y,
            size.width,
            size.height,
            { isStatic: true },
        )
        Matter.Composite.add(this.world, body)
        const id = this.nextId++
        this.registrations.set(id, {
            body,
            anchor: { ...position },
            isStatic: true,
            onTransform: opts.onTransform,
            width: size.width,
            height: size.height,
            buoyancy: 'heavy',
        })
        return id
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

    applyImpulse(handle: PhysicsHandle, impulse: Vec2): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        Matter.Body.setVelocity(reg.body, {
            x: reg.body.velocity.x + impulse.x / reg.body.mass,
            y: reg.body.velocity.y + impulse.y / reg.body.mass,
        })
    }

    setPosition(handle: PhysicsHandle, position: Vec2): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        Matter.Body.setPosition(reg.body, position)
        Matter.Body.setVelocity(reg.body, { x: 0, y: 0 })
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
        Matter.Body.setPosition(this._floor, { x: vp.width / 2, y: vp.height - bottom + hw })
        Matter.Body.setPosition(this._ceiling, { x: vp.width / 2, y: top - hw })
        Matter.Body.setPosition(this._leftWall, { x: -hw, y: vp.height / 2 })
        Matter.Body.setPosition(this._rightWall, { x: vp.width + hw, y: vp.height / 2 })
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

    setSize(handle: PhysicsHandle, size: CardSize): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        const sx = size.width / reg.width
        const sy = size.height / reg.height
        Matter.Body.scale(reg.body, sx, sy)
        reg.width = size.width
        reg.height = size.height
    }

    setAngle(handle: PhysicsHandle, angle: number): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        Matter.Body.setAngle(reg.body, angle)
        Matter.Body.setAngularVelocity(reg.body, 0)
    }

    linkBodies(
        a: PhysicsHandle,
        b: PhysicsHandle,
        opts: LinkOptions = {},
    ): LinkHandle {
        const regA = this.registrations.get(a)
        if (!regA) throw new Error(`PhysicsWorld: unknown handle ${a}`)
        const regB = this.registrations.get(b)
        if (!regB) throw new Error(`PhysicsWorld: unknown handle ${b}`)
        const dx = regB.body.position.x - regA.body.position.x
        const dy = regB.body.position.y - regA.body.position.y
        const defaultLength = Math.sqrt(dx * dx + dy * dy)
        const constraint = Matter.Constraint.create({
            bodyA: regA.body,
            bodyB: regB.body,
            length: opts.length ?? defaultLength,
            stiffness: opts.stiffness ?? 0.05,
            damping: opts.damping ?? 0.1,
        })
        Matter.Composite.add(this.world, constraint)
        const id = this.nextId++
        this.links.set(id, constraint)
        return id
    }

    unlinkBodies(link: LinkHandle): void {
        const constraint = this.links.get(link)
        if (!constraint) return
        Matter.Composite.remove(this.world, constraint)
        this.links.delete(link)
    }

    tether(parent: PhysicsHandle, child: PhysicsHandle, length: number, anchorA?: Vec2): TetherHandle {
        const regP = this.registrations.get(parent)
        if (!regP) throw new Error(`PhysicsWorld: unknown handle ${parent}`)
        const regC = this.registrations.get(child)
        if (!regC) throw new Error(`PhysicsWorld: unknown handle ${child}`)
        // Construct the constraint directly so we can pass body-local pointA when supplied.
        // stiffness ~0 because the pull-only rope force is applied in tick(), not by matter.js.
        const constraint = Matter.Constraint.create({
            bodyA: regP.body,
            bodyB: regC.body,
            length,
            stiffness: 1e-9,
            damping: 0,
            ...(anchorA ? { pointA: { ...anchorA } } : {}),
        })
        Matter.Composite.add(this.world, constraint)
        const lh = this.nextId++
        this.links.set(lh, constraint)
        const th = this.nextId++
        this.tethers.set(th, {
            parent,
            child,
            length,
            linkHandle: lh,
            ...(anchorA ? { anchorA: { ...anchorA } } : {}),
        })
        this.cachedTetherList = null
        for (const cb of this.tetherChangeListeners) cb()
        return th
    }

    untether(th: TetherHandle): void {
        const rec = this.tethers.get(th)
        if (!rec) return
        this.unlinkBodies(rec.linkHandle)
        this.tethers.delete(th)
        this.cachedTetherList = null
        for (const cb of this.tetherChangeListeners) cb()
    }

    getTethers(): TetherView[] {
        const views: TetherView[] = []
        for (const rec of this.tethers.values()) {
            const regP = this.registrations.get(rec.parent)
            const regC = this.registrations.get(rec.child)
            if (!regP || !regC) continue
            // World-space rope origin is the constraint's pointA. For static ceiling/floor (angle = 0)
            // and dynamic parents with zero rotation, this is parentBodyCentre + anchorA.
            const bodyPos = regP.body.position
            const parentPos: Vec2 = rec.anchorA
                ? { x: bodyPos.x + rec.anchorA.x, y: bodyPos.y + rec.anchorA.y }
                : { x: bodyPos.x, y: bodyPos.y }
            const childPos = { x: regC.body.position.x, y: regC.body.position.y }
            const d = Math.hypot(childPos.x - parentPos.x, childPos.y - parentPos.y)
            views.push({ parentPos, childPos, length: rec.length, slack: d < rec.length * 0.98 })
        }
        return views
    }

    // Stable-identity snapshot for useSyncExternalStore consumers. Reference only changes
    // when the tether set changes (mount/unmount), not on every call.
    getTetherList(): ReadonlyArray<TetherHandle> {
        if (!this.cachedTetherList) {
            this.cachedTetherList = Object.freeze(Array.from(this.tethers.keys()))
        }
        return this.cachedTetherList
    }

    subscribeTetherSetChange(cb: () => void): () => void {
        this.tetherChangeListeners.add(cb)
        return () => this.tetherChangeListeners.delete(cb)
    }

    listTetherRecords(): Array<{
        handle: TetherHandle
        parent: PhysicsHandle
        child: PhysicsHandle
        length: number
        anchorA?: Vec2
    }> {
        const out: Array<{
            handle: TetherHandle
            parent: PhysicsHandle
            child: PhysicsHandle
            length: number
            anchorA?: Vec2
        }> = []
        for (const [handle, rec] of this.tethers) {
            out.push({
                handle,
                parent: rec.parent,
                child: rec.child,
                length: rec.length,
                ...(rec.anchorA ? { anchorA: { ...rec.anchorA } } : {}),
            })
        }
        return out
    }

    setSensor(handle: PhysicsHandle, isSensor: boolean): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        Matter.Body.set(reg.body, 'isSensor', isSensor)
    }

    setStatic(handle: PhysicsHandle, isStatic: boolean): void {
        const reg = this.registrations.get(handle)
        if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
        if (reg.isStatic) return
        Matter.Body.setStatic(reg.body, isStatic)
    }

    tick(dtMs: number): void {
        // 1. Apply balloon buoyancy — per-tick force opposing gravity, scaled to match gravity force units
        const g = this.getGravityVector()
        const gravScale: number = (this.engine.gravity as { scale?: number }).scale ?? 0.001
        for (const reg of this.registrations.values()) {
            if (reg.isStatic || reg.buoyancy !== 'balloon') continue
            Matter.Body.applyForce(reg.body, reg.body.position, {
                x: -g.x * reg.body.mass * gravScale * BUOYANCY_GAIN,
                y: -g.y * reg.body.mass * gravScale * BUOYANCY_GAIN,
            })
        }

        // 2. Apply pull-only tether forces (rope semantics).
        // Force is measured from the world-space rope origin (parent body centre + anchorA),
        // not the parent body centre alone — otherwise a string anchored above a card's x
        // would let the card drift to the parent body centre's x before the rope catches.
        for (const rec of this.tethers.values()) {
            const regP = this.registrations.get(rec.parent)
            const regC = this.registrations.get(rec.child)
            if (!regP || !regC) continue
            const parentX = regP.body.position.x + (rec.anchorA?.x ?? 0)
            const parentY = regP.body.position.y + (rec.anchorA?.y ?? 0)
            const dx = parentX - regC.body.position.x
            const dy = parentY - regC.body.position.y
            const d = Math.hypot(dx, dy)
            if (d <= rec.length || d === 0) continue
            const overshoot = d - rec.length
            const nx = dx / d
            const ny = dy / d
            const a = overshoot * TETHER_STIFFNESS  // acceleration-scale; multiply by mass → force
            if (!regC.body.isStatic) {
                Matter.Body.applyForce(regC.body, regC.body.position, { x: nx * a * regC.body.mass, y: ny * a * regC.body.mass })
            }
            if (!regP.body.isStatic) {
                Matter.Body.applyForce(regP.body, regP.body.position, { x: -nx * a * regP.body.mass, y: -ny * a * regP.body.mass })
            }
        }

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
