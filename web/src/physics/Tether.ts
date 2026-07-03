import { physicsTuning } from './physicsTuning'
import type { BodyForceSource } from './BodyForceSource'
import type { ParentRef } from './PageSpec'
import type { PhysicsHandle, PhysicsWorld, Vec2 } from './PhysicsWorld'

export type TetherHandle = number

export type TetherParentKind = 'ceiling' | 'floor' | 'card'

export function resolveParent(
    world: PhysicsWorld,
    ref: NonNullable<ParentRef>,
): { handle: PhysicsHandle; kind: TetherParentKind } | null {
    if (ref === 'ceiling') return { handle: world.ceilingHandle, kind: 'ceiling' }
    if (ref === 'floor') return { handle: world.floorHandle, kind: 'floor' }
    // v2 content-box edges — the edge-anchored regime. Top is ceiling-like (a
    // card hangs below it), bottom is floor-like; both reuse the static-edge
    // branch of `wireTetherFor`. Null until a box is registered, so a card
    // declared with a box parent retries (like a not-yet-registered card).
    if (ref === 'box-top') {
        const h = world.contentBoxTopHandle
        return h !== undefined ? { handle: h, kind: 'ceiling' } : null
    }
    if (ref === 'box-bottom') {
        const h = world.contentBoxBottomHandle
        return h !== undefined ? { handle: h, kind: 'floor' } : null
    }
    const h = world.getHandleById(ref)
    return h !== undefined ? { handle: h, kind: 'card' } : null
}

/**
 * Radial attach geometry for a static/edge tether parent (spec §3.3). The
 * attach point is the point on the edge **nearest the child** — for a
 * horizontal top/bottom (or ceiling/floor) edge that is directly above/below
 * the child, clamped to the edge's width so a parked rope never converges on
 * the bar's centre — and `length` is the true (Euclidean) distance from there,
 * replacing the old y-projection (which dropped any horizontal offset). Shared
 * by `wireTetherFor` and `PinnedCard`'s `parkAt` so authored and auto-parked
 * ropes wire the same way. Numerically identical to the y-projection when the
 * child sits within the edge's width (the shipped case).
 */
export function edgeAttachPoint(
    world: PhysicsWorld,
    parentHandle: PhysicsHandle,
    childAnchor: Vec2,
): { anchorA: Vec2; length: number } {
    const parentBodyPos = world.getPosition(parentHandle)
    const parentAnchor = world.getAnchor(parentHandle)
    const halfWidth = world.getSize(parentHandle).width / 2
    const attachX = Math.min(
        Math.max(childAnchor.x, parentBodyPos.x - halfWidth),
        parentBodyPos.x + halfWidth,
    )
    const attachY = parentAnchor.y
    return {
        anchorA: { x: attachX - parentBodyPos.x, y: attachY - parentBodyPos.y },
        length: Math.hypot(childAnchor.x - attachX, childAnchor.y - attachY),
    }
}

export function wireTetherFor(
    world: PhysicsWorld,
    parentHandle: PhysicsHandle,
    parentKind: TetherParentKind,
    childHandle: PhysicsHandle,
    childAnchor: Vec2,
): TetherHandle {
    if (parentKind === 'card') {
        const parentBodyPos = world.getPosition(parentHandle)
        const length = Math.hypot(
            childAnchor.x - parentBodyPos.x,
            childAnchor.y - parentBodyPos.y,
        )
        return world.tether.add(parentHandle, childHandle, length)
    }
    const { anchorA, length } = edgeAttachPoint(world, parentHandle, childAnchor)
    return world.tether.add(parentHandle, childHandle, length, anchorA)
}

export interface TetherView {
    parentPos: Vec2
    childPos: Vec2
    length: number
    slack: boolean
    /**
     * Continuous rope-stretch ratio `max(0, dist − length) / length` — task-039's
     * fat-tether render input (also drives StringLayer's drift stroke/opacity).
     * 0 while at/under rest length, ramping up as the rope stretches, unbounded
     * above (consumers normalise). See `list()` for the pinned formula + why its
     * zero-crossing differs from `slack`.
     */
    tension: number
}

export interface TetherRecord {
    handle: TetherHandle
    parent: PhysicsHandle
    child: PhysicsHandle
    length: number
    anchorA?: Vec2
}

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
     * Set a tether's rest length in place — used by the auto-park / recall ease
     * (spike G3: relax the parked length to taut). Deliberately does **not**
     * `invalidate()`: `length` is read live per-frame by `list()`/
     * `applyRopeForces`, while `subscribeChange` exists only to re-render the
     * StringLayer when the *set* of tethers changes — easing length every frame
     * must not churn React. Unknown handle is a no-op.
     */
    setLength(handle: TetherHandle, length: number): void {
        const rec = this.records_.get(handle)
        if (rec) rec.length = length
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
                slack: dist < rec.length * physicsTuning.slackFactor,
                // Pinned tension formula (task-039 contract): max(0, dist − length)
                // / length. Its zero-crossing is the RAW rest length, matching the
                // pull-only force threshold in applyRopeForces (`d <= rec.length`) —
                // deliberately NOT the 0.98 slackFactor `slack` uses. So in the band
                // length*slackFactor ≤ dist < length the rope draws taut (slack=false)
                // while tension is still 0. Do not "fix" this to slackFactor: it would
                // desync tension from the actual rope force. length-guard avoids /0 on
                // a degenerate zero-length record. NOTE: list() allocates fresh views
                // per call (no cache — positions are live per-frame); read once/frame.
                tension:
                    rec.length > 0
                        ? Math.max(0, dist - rec.length) / rec.length
                        : 0,
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
            // Read-at-use per tick — see physicsTuning.ts for the tuning notes.
            const a = overshoot * physicsTuning.tetherStiffness
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
