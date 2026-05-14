/**
 * In-memory `BodyDriver` for primitive tests. No matter.js, no RAF, no time
 * mocking — tests drive elapsed time via `vi.useFakeTimers` and advance the
 * primitive's `step(dtMs)` directly.
 *
 * Returned alongside the driver:
 *   - `registerBody(id, state)` — explicit per-test fixture setup.
 *   - `addTether(spec)` — pre-wire tethers so tests can observe detach/restore.
 *   - `getCalls()` — ordered log of every mutator + tether op for shape-of-
 *     motion assertions (e.g. "setDragging(true) recorded before any
 *     setPosition for the same handle").
 *   - `getTethers()` — live snapshot of attached tethers, for "is the chain
 *     still attached?" assertions.
 *   - `getState(handle)` — current body state, for "where did the kinematic
 *     tween land?" assertions.
 *
 * Not re-exported from any production barrel.
 */

import type {
    BodyDriver,
    PhysicsHandle,
    TetherSpec,
    Vec2,
} from './BodyDriver'

export interface FakeBodyState {
    position: Vec2
    velocity: Vec2
    size: { width: number; height: number }
    buoyancy: 'balloon' | 'heavy'
    isStatic: boolean
    isSensor: boolean
    isDragging: boolean
}

export type FakeBodyCall =
    | { type: 'setPosition'; handle: PhysicsHandle; v: Vec2 }
    | { type: 'setVelocity'; handle: PhysicsHandle; v: Vec2 }
    | { type: 'setDragging'; handle: PhysicsHandle; dragging: boolean }
    | { type: 'setSensor'; handle: PhysicsHandle; asSensor: boolean }
    | { type: 'detachTetherOf'; handle: PhysicsHandle; result: TetherSpec | undefined }
    | { type: 'attachTether'; spec: TetherSpec }

export interface RegisterBodyOptions {
    position: Vec2
    size?: { width: number; height: number }
    velocity?: Vec2
    buoyancy?: 'balloon' | 'heavy'
    isStatic?: boolean
    isSensor?: boolean
    isDragging?: boolean
}

export interface FakeBodyDriver {
    driver: BodyDriver
    registerBody(id: string, opts: RegisterBodyOptions): PhysicsHandle
    addTether(spec: TetherSpec): void
    getCalls(): readonly FakeBodyCall[]
    getTethers(): readonly TetherSpec[]
    getState(handle: PhysicsHandle): FakeBodyState | undefined
}

export interface CreateFakeBodyDriverOptions {
    gravity?: Vec2
}

export function createFakeBodyDriver(
    options: CreateFakeBodyDriverOptions = {},
): FakeBodyDriver {
    const gravity: Vec2 = options.gravity ?? { x: 0, y: 0.7 }
    let nextHandle: PhysicsHandle = 1
    const idToHandle = new Map<string, PhysicsHandle>()
    const bodies = new Map<PhysicsHandle, FakeBodyState>()
    const tethers: TetherSpec[] = []
    const calls: FakeBodyCall[] = []

    const requireBody = (h: PhysicsHandle): FakeBodyState => {
        const b = bodies.get(h)
        if (!b) throw new Error(`FakeBodyDriver: unknown handle ${h}`)
        return b
    }

    const driver: BodyDriver = {
        getHandleById: (id) => idToHandle.get(id),
        has: (h) => bodies.has(h),
        getPosition: (h) => {
            const b = requireBody(h)
            return { x: b.position.x, y: b.position.y }
        },
        getVelocity: (h) => {
            const b = requireBody(h)
            return { x: b.velocity.x, y: b.velocity.y }
        },
        getSize: (h) => {
            const b = requireBody(h)
            return { width: b.size.width, height: b.size.height }
        },
        isStatic: (h) => requireBody(h).isStatic,
        getBuoyancy: (h) => requireBody(h).buoyancy,
        getGravityVector: () => ({ x: gravity.x, y: gravity.y }),
        setPosition: (h, v) => {
            const b = requireBody(h)
            b.position = { x: v.x, y: v.y }
            calls.push({ type: 'setPosition', handle: h, v: { x: v.x, y: v.y } })
        },
        setVelocity: (h, v) => {
            const b = requireBody(h)
            b.velocity = { x: v.x, y: v.y }
            calls.push({ type: 'setVelocity', handle: h, v: { x: v.x, y: v.y } })
        },
        setDragging: (h, dragging) => {
            const b = requireBody(h)
            if (b.isStatic) return
            b.isDragging = dragging
            calls.push({ type: 'setDragging', handle: h, dragging })
        },
        setSensor: (h, asSensor) => {
            const b = requireBody(h)
            b.isSensor = asSensor
            calls.push({ type: 'setSensor', handle: h, asSensor })
        },
        detachTetherOf: (child) => {
            const idx = tethers.findIndex((t) => t.child === child)
            if (idx < 0) {
                calls.push({ type: 'detachTetherOf', handle: child, result: undefined })
                return undefined
            }
            const removed = tethers[idx]!
            const spec: TetherSpec = {
                parent: removed.parent,
                child: removed.child,
                length: removed.length,
                ...(removed.anchorA ? { anchorA: { ...removed.anchorA } } : {}),
            }
            tethers.splice(idx, 1)
            calls.push({ type: 'detachTetherOf', handle: child, result: spec })
            return spec
        },
        attachTether: (spec) => {
            const stored: TetherSpec = {
                parent: spec.parent,
                child: spec.child,
                length: spec.length,
                ...(spec.anchorA ? { anchorA: { ...spec.anchorA } } : {}),
            }
            tethers.push(stored)
            calls.push({ type: 'attachTether', spec: stored })
        },
    }

    return {
        driver,
        registerBody(id, opts) {
            if (idToHandle.has(id)) {
                throw new Error(`FakeBodyDriver: duplicate id "${id}"`)
            }
            const handle = nextHandle++
            idToHandle.set(id, handle)
            bodies.set(handle, {
                position: { x: opts.position.x, y: opts.position.y },
                velocity: opts.velocity
                    ? { x: opts.velocity.x, y: opts.velocity.y }
                    : { x: 0, y: 0 },
                size: opts.size ?? { width: 200, height: 100 },
                buoyancy: opts.buoyancy ?? 'heavy',
                isStatic: opts.isStatic ?? false,
                isSensor: opts.isSensor ?? false,
                isDragging: opts.isDragging ?? false,
            })
            return handle
        },
        addTether(spec) {
            tethers.push({
                parent: spec.parent,
                child: spec.child,
                length: spec.length,
                ...(spec.anchorA ? { anchorA: { ...spec.anchorA } } : {}),
            })
        },
        getCalls: () => calls,
        getTethers: () => tethers,
        getState: (h) => bodies.get(h),
    }
}
