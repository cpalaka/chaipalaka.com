import type {
    PhysicsHandle,
    PhysicsWorld,
    Vec2,
    Viewport,
} from '../../physics/PhysicsWorld'
import type { PrimitiveStep } from './types'

export interface AnchorSlideTargets {
    fromIds: readonly string[]
    toIds: readonly string[]
}

export interface AnchorSlideOpts {
    axis: 'horizontal' | 'vertical'
    sign: 1 | -1
    durationMs: number
    viewport: Viewport
    /**
     * Temporarily toggle a viewport edge to sensor mode for the duration of the
     * slide. Used by T4 (within-page section pagination) so chains can pass
     * through the ceiling (forward) or floor (back) edge. Restored at the end.
     */
    sensorEdges?: 'ceiling' | 'floor' | 'none'
}

const OFFSCREEN_PAD = 100

interface CapturedTether {
    parent: PhysicsHandle
    length: number
    anchorA?: Vec2
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

/**
 * Untether the first record where `child === handle` and return its spec
 * (parent + length + optional anchorA). Returns undefined if the card has
 * no tether. Mirrors `pourInDrop`'s capture pattern so StringLayer doesn't
 * draw a long diagonal string from the original parent anchor to the
 * sliding card.
 */
function captureAndUntether(
    world: PhysicsWorld,
    handle: PhysicsHandle,
): CapturedTether | undefined {
    for (const t of world.tether.records()) {
        if (t.child !== handle) continue
        const captured: CapturedTether = {
            parent: t.parent,
            length: t.length,
            ...(t.anchorA ? { anchorA: { ...t.anchorA } } : {}),
        }
        world.tether.remove(t.handle)
        return captured
    }
    return undefined
}

export function anchorSlide(
    world: PhysicsWorld,
    targets: AnchorSlideTargets,
    opts: AnchorSlideOpts,
): PrimitiveStep {
    const { axis, sign, durationMs, viewport, sensorEdges } = opts
    let elapsedMs = 0
    let initialized = false

    const sensorEdgeHandle =
        sensorEdges === 'ceiling'
            ? world.ceilingHandle
            : sensorEdges === 'floor'
              ? world.floorHandle
              : undefined

    const fromInitial = new Map<string, Vec2>()
    const fromFinal = new Map<string, Vec2>()
    const toInitial = new Map<string, Vec2>()
    const toLayout = new Map<string, Vec2>()
    // To-card tethers captured on init are re-attached at completion so the
    // card resumes hanging at its layout anchor. From-card tethers are
    // captured-and-discarded — the cards are about to be released by
    // TransitionDirector when the slide ends.
    const toCaptured = new Map<string, CapturedTether>()

    const horizontalSpan = viewport.width + OFFSCREEN_PAD
    const verticalSpan = viewport.height + OFFSCREEN_PAD

    const offsetFor = (direction: -1 | 1) => {
        if (axis === 'horizontal') {
            return { x: direction * horizontalSpan, y: 0 }
        }
        return { x: 0, y: direction * verticalSpan }
    }

    return (dtMs) => {
        if (!initialized) {
            if (sensorEdgeHandle !== undefined) {
                world.setSensor(sensorEdgeHandle, true)
            }
            for (const id of targets.fromIds) {
                const handle = world.getHandleById(id)
                if (handle === undefined) continue
                captureAndUntether(world, handle)
                const pos = world.getPosition(handle)
                const start = { x: pos.x, y: pos.y }
                fromInitial.set(id, start)
                // From-card exits in axis × -sign direction
                const exitOffset = offsetFor(-sign as -1 | 1)
                fromFinal.set(id, {
                    x: start.x + exitOffset.x,
                    y: start.y + exitOffset.y,
                })
                world.setDragging(handle, true)
            }
            for (const id of targets.toIds) {
                const handle = world.getHandleById(id)
                if (handle === undefined) continue
                const captured = captureAndUntether(world, handle)
                if (captured) toCaptured.set(id, captured)
                const pos = world.getPosition(handle)
                const layout = { x: pos.x, y: pos.y }
                toLayout.set(id, layout)
                // To-card enters from the OPPOSITE side of the from-card's
                // exit (sign direction) so the two move as a unified strip:
                // e.g. forward vertical (sign=+1) → from exits up, to enters
                // from below. Without this the cards would pass through
                // each other in opposite directions.
                const enterOffset = offsetFor(sign)
                const start = {
                    x: layout.x + enterOffset.x,
                    y: layout.y + enterOffset.y,
                }
                toInitial.set(id, start)
                world.setDragging(handle, true)
                world.setPosition(handle, start)
            }
            initialized = true
        }

        elapsedMs += dtMs
        const tRaw = Math.min(elapsedMs / durationMs, 1)
        const eased = easeOutCubic(tRaw)

        for (const id of targets.fromIds) {
            const handle = world.getHandleById(id)
            if (handle === undefined) continue
            const a = fromInitial.get(id)
            const b = fromFinal.get(id)
            if (!a || !b) continue
            world.setPosition(handle, {
                x: a.x + (b.x - a.x) * eased,
                y: a.y + (b.y - a.y) * eased,
            })
        }
        for (const id of targets.toIds) {
            const handle = world.getHandleById(id)
            if (handle === undefined) continue
            const a = toInitial.get(id)
            const b = toLayout.get(id)
            if (!a || !b) continue
            world.setPosition(handle, {
                x: a.x + (b.x - a.x) * eased,
                y: a.y + (b.y - a.y) * eased,
            })
        }

        if (tRaw >= 1) {
            for (const id of targets.fromIds) {
                const handle = world.getHandleById(id)
                if (handle === undefined) continue
                world.setDragging(handle, false)
            }
            for (const id of targets.toIds) {
                const handle = world.getHandleById(id)
                if (handle === undefined) continue
                world.setDragging(handle, false)
                world.setVelocity(handle, { x: 0, y: 0 })
                const captured = toCaptured.get(id)
                if (captured) {
                    world.tether.add(
                        captured.parent,
                        handle,
                        captured.length,
                        captured.anchorA,
                    )
                }
            }
            if (sensorEdgeHandle !== undefined) {
                world.setSensor(sensorEdgeHandle, false)
            }
            return true
        }
        return false
    }
}
