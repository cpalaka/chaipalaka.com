import Matter from 'matter-js'

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
}

export type PhysicsHandle = number
export type LinkHandle = number

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

interface Registration {
    body: Matter.Body
    spring?: Matter.Constraint
    anchor: Vec2
    isStatic: boolean
    onTransform?: (state: BodyState) => void
    width: number
    height: number
}

const SPRING_STIFFNESS = 1e-9
const SPRING_DAMPING = 0
const GRAVITY_Y = 0.7
const BODY_FRICTION_AIR = 0.05
const FLOOR_THICKNESS = 60

export class PhysicsWorld {
    private engine: Matter.Engine
    private world: Matter.World
    private floor: Matter.Body
    private nextId: PhysicsHandle = 1
    private registrations = new Map<PhysicsHandle, Registration>()
    private links = new Map<LinkHandle, Matter.Constraint>()

    constructor(opts: PhysicsWorldOptions) {
        this.engine = Matter.Engine.create()
        this.world = this.engine.world
        this.engine.gravity.x = 0
        this.engine.gravity.y = 0

        this.floor = Matter.Bodies.rectangle(
            opts.viewport.width / 2,
            opts.viewport.height + FLOOR_THICKNESS / 2,
            opts.viewport.width,
            FLOOR_THICKNESS,
            { isStatic: true },
        )
        Matter.Composite.add(this.world, this.floor)
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
            {
                frictionAir: BODY_FRICTION_AIR,
            },
        )
        const spring = Matter.Constraint.create({
            pointA: { x: anchor.x, y: anchor.y },
            bodyB: body,
            pointB: { x: 0, y: 0 },
            stiffness: SPRING_STIFFNESS,
            damping: SPRING_DAMPING,
            length: 0,
        })
        Matter.Composite.add(this.world, [body, spring])
        const id = this.nextId++
        this.registrations.set(id, {
            body,
            spring,
            anchor: { ...anchor },
            isStatic: false,
            onTransform: opts.onTransform,
            width: size.width,
            height: size.height,
        })
        return id
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
            spring: undefined,
            anchor: { ...position },
            isStatic: true,
            onTransform: opts.onTransform,
            width: size.width,
            height: size.height,
        })
        return id
    }

    unregister(handle: PhysicsHandle): void {
        const reg = this.registrations.get(handle)
        if (!reg) return
        Matter.Composite.remove(this.world, reg.body)
        if (reg.spring) Matter.Composite.remove(this.world, reg.spring)
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

    setGravity(on: boolean): void {
        this.engine.gravity.y = on ? GRAVITY_Y : 0
        for (const reg of this.registrations.values()) {
            if (reg.isStatic || !reg.spring) continue
            reg.spring.stiffness = SPRING_STIFFNESS
        }
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
        if (reg.isStatic || !reg.spring) {
            Matter.Body.setPosition(reg.body, anchor)
            reg.anchor = { ...anchor }
            return
        }
        reg.anchor = { ...anchor }
        reg.spring.pointA!.x = anchor.x
        reg.spring.pointA!.y = anchor.y
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
        Matter.Engine.update(this.engine, dtMs)
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
