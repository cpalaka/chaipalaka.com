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
export type CardMode = 'breathing' | 'playground'

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
  spring: Matter.Constraint
  anchor: Vec2
  mode: CardMode
  onTransform?: (state: BodyState) => void
}

const MODE_STIFFNESS: Record<CardMode, number> = {
  breathing: 0.1,
  playground: 1e-9,
}
const MODE_DAMPING: Record<CardMode, number> = {
  breathing: 0.3,
  playground: 0,
}
const GRAVITY_RELAXED_STIFFNESS = 1e-9
const GRAVITY_Y = 0.7
const BODY_FRICTION_AIR = 0.05
const FLOOR_THICKNESS = 60

export class PhysicsWorld {
  private engine: Matter.Engine
  private world: Matter.World
  private floor: Matter.Body
  private nextId: PhysicsHandle = 1
  private registrations = new Map<PhysicsHandle, Registration>()
  private gravityOn = false

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

  register(anchor: Vec2, size: CardSize, opts: RegisterOptions = {}): PhysicsHandle {
    const body = Matter.Bodies.rectangle(anchor.x, anchor.y, size.width, size.height, {
      frictionAir: BODY_FRICTION_AIR,
    })
    const mode: CardMode = 'breathing'
    const spring = Matter.Constraint.create({
      pointA: { x: anchor.x, y: anchor.y },
      bodyB: body,
      pointB: { x: 0, y: 0 },
      stiffness: this.gravityOn ? GRAVITY_RELAXED_STIFFNESS : MODE_STIFFNESS[mode],
      damping: MODE_DAMPING[mode],
      length: 0,
    })
    Matter.Composite.add(this.world, [body, spring])
    const id = this.nextId++
    this.registrations.set(id, {
      body,
      spring,
      anchor: { ...anchor },
      mode,
      onTransform: opts.onTransform,
    })
    return id
  }

  unregister(handle: PhysicsHandle): void {
    const reg = this.registrations.get(handle)
    if (!reg) return
    Matter.Composite.remove(this.world, reg.body)
    Matter.Composite.remove(this.world, reg.spring)
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
    this.gravityOn = on
    this.engine.gravity.y = on ? GRAVITY_Y : 0
    for (const reg of this.registrations.values()) {
      reg.spring.stiffness = on ? GRAVITY_RELAXED_STIFFNESS : MODE_STIFFNESS[reg.mode]
    }
  }

  setMode(handle: PhysicsHandle, mode: CardMode): void {
    const reg = this.registrations.get(handle)
    if (!reg) throw new Error(`PhysicsWorld: unknown handle ${handle}`)
    reg.mode = mode
    reg.spring.damping = MODE_DAMPING[mode]
    if (!this.gravityOn) {
      reg.spring.stiffness = MODE_STIFFNESS[mode]
    }
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
