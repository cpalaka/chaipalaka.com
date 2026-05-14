import type { BodyForceSource } from './BodyForceSource'
import type { PhysicsHandle, PhysicsWorld, Vec2 } from './PhysicsWorld'

export type TetherHandle = number

export type TetherParentKind = 'ceiling' | 'floor' | 'card'

export function wireTetherFor(
    world: PhysicsWorld,
    parentHandle: PhysicsHandle,
    parentKind: TetherParentKind,
    childHandle: PhysicsHandle,
    childAnchor: Vec2,
): TetherHandle {
    const parentBodyPos = world.getPosition(parentHandle)
    if (parentKind === 'card') {
        const length = Math.hypot(
            childAnchor.x - parentBodyPos.x,
            childAnchor.y - parentBodyPos.y,
        )
        return world.tether.add(parentHandle, childHandle, length)
    }
    const parentAnchor = world.getAnchor(parentHandle)
    const anchorA = {
        x: childAnchor.x - parentBodyPos.x,
        y: parentAnchor.y - parentBodyPos.y,
    }
    const length = Math.abs(childAnchor.y - parentAnchor.y)
    return world.tether.add(parentHandle, childHandle, length, anchorA)
}

export interface TetherView {
    parentPos: Vec2
    childPos: Vec2
    length: number
    slack: boolean
}

export interface TetherRecord {
    handle: TetherHandle
    parent: PhysicsHandle
    child: PhysicsHandle
    length: number
    anchorA?: Vec2
}

// Per-tick "acceleration scale" used to convert tether overshoot into a force
// (multiplied by body mass at the apply site). The 1e-9-stiffness matter.js
// constraint that used to back the tether was vestigial — issue #108 cut it,
// so this number alone now drives rope physics. The value is hand-tuned to
// match the behaviour cards exhibited in May 2026; do not change without a
// matching pendulum-settle regression review.
export const TETHER_STIFFNESS = 1.75e-5

const SLACK_FACTOR = 0.98

export class Tether {
    private readonly bodies: BodyForceSource
    private nextHandle: TetherHandle = 1
    private readonly records_ = new Map<TetherHandle, TetherRecord>()
    private cachedRecords: readonly TetherRecord[] | null = null
    private readonly listeners = new Set<() => void>()

    constructor(bodies: BodyForceSource) {
        this.bodies = bodies
    }

    add(
        parent: PhysicsHandle,
        child: PhysicsHandle,
        length: number,
        anchorA?: Vec2,
    ): TetherHandle {
        const handle = this.nextHandle++
        const rec: TetherRecord = {
            handle,
            parent,
            child,
            length,
            ...(anchorA ? { anchorA: { ...anchorA } } : {}),
        }
        this.records_.set(handle, rec)
        this.invalidate()
        return handle
    }

    remove(handle: TetherHandle): void {
        if (!this.records_.delete(handle)) return
        this.invalidate()
    }

    /**
     * Drop every tether record that references `body` as either parent or
     * child, returning the number removed. Called by `PhysicsWorld.unregister`
     * to enforce the invariant that no tether may reference a body the world
     * no longer knows about. Without this sweep, any record produced by a
     * primitive's `detachTetherOf`/`attachTether` cycle (whose new handle is
     * not known to the React component that owned the original) becomes an
     * orphan as soon as the body unregisters, throwing `unknown handle N` on
     * the next physics tick.
     */
    removeReferencing(body: PhysicsHandle): number {
        let removed = 0
        for (const [handle, rec] of this.records_) {
            if (rec.parent === body || rec.child === body) {
                this.records_.delete(handle)
                removed += 1
            }
        }
        if (removed > 0) this.invalidate()
        return removed
    }

    records(): readonly TetherRecord[] {
        if (!this.cachedRecords) {
            this.cachedRecords = Object.freeze(
                Array.from(this.records_.values()).map((r) => ({
                    handle: r.handle,
                    parent: r.parent,
                    child: r.child,
                    length: r.length,
                    ...(r.anchorA ? { anchorA: { ...r.anchorA } } : {}),
                })),
            )
        }
        return this.cachedRecords
    }

    list(): readonly TetherView[] {
        const views: TetherView[] = []
        for (const rec of this.records_.values()) {
            const parentBody = this.bodies.getPosition(rec.parent)
            const childPos = this.bodies.getPosition(rec.child)
            const parentPos: Vec2 = rec.anchorA
                ? {
                      x: parentBody.x + rec.anchorA.x,
                      y: parentBody.y + rec.anchorA.y,
                  }
                : parentBody
            const dist = Math.hypot(
                childPos.x - parentPos.x,
                childPos.y - parentPos.y,
            )
            views.push({
                parentPos,
                childPos,
                length: rec.length,
                slack: dist < rec.length * SLACK_FACTOR,
            })
        }
        return views
    }

    subscribeChange(cb: () => void): () => void {
        this.listeners.add(cb)
        return () => {
            this.listeners.delete(cb)
        }
    }

    applyRopeForces(): void {
        for (const rec of this.records_.values()) {
            const parentBody = this.bodies.getPosition(rec.parent)
            const childPos = this.bodies.getPosition(rec.child)
            const parentX = parentBody.x + (rec.anchorA?.x ?? 0)
            const parentY = parentBody.y + (rec.anchorA?.y ?? 0)
            const dx = parentX - childPos.x
            const dy = parentY - childPos.y
            const d = Math.hypot(dx, dy)
            if (d <= rec.length || d === 0) continue
            const overshoot = d - rec.length
            const nx = dx / d
            const ny = dy / d
            const a = overshoot * TETHER_STIFFNESS
            if (!this.bodies.isStatic(rec.child)) {
                const m = this.bodies.getMass(rec.child)
                this.bodies.applyForce(rec.child, {
                    x: nx * a * m,
                    y: ny * a * m,
                })
            }
            if (!this.bodies.isStatic(rec.parent)) {
                const m = this.bodies.getMass(rec.parent)
                this.bodies.applyForce(rec.parent, {
                    x: -nx * a * m,
                    y: -ny * a * m,
                })
            }
        }
    }

    private invalidate(): void {
        this.cachedRecords = null
        for (const cb of this.listeners) cb()
    }
}
