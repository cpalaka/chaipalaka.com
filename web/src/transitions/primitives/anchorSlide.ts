import type { PhysicsWorld, Viewport } from '../../physics/PhysicsWorld'
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
}

const OFFSCREEN_PAD = 100

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

export function anchorSlide(
    world: PhysicsWorld,
    targets: AnchorSlideTargets,
    opts: AnchorSlideOpts,
): PrimitiveStep {
    const { axis, sign, durationMs, viewport } = opts
    let elapsedMs = 0
    let initialized = false

    const fromInitial = new Map<string, { x: number; y: number }>()
    const fromFinal = new Map<string, { x: number; y: number }>()
    const toInitial = new Map<string, { x: number; y: number }>()
    const toLayout = new Map<string, { x: number; y: number }>()

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
            for (const id of targets.fromIds) {
                const handle = world.getHandleById(id)
                if (handle === undefined) continue
                const pos = world.getPosition(handle)
                const start = { x: pos.x, y: pos.y }
                fromInitial.set(id, start)
                // From-card exits in axis × -sign direction
                const exitOffset = offsetFor((-sign) as -1 | 1)
                fromFinal.set(id, {
                    x: start.x + exitOffset.x,
                    y: start.y + exitOffset.y,
                })
                world.setDragging(handle, true)
            }
            for (const id of targets.toIds) {
                const handle = world.getHandleById(id)
                if (handle === undefined) continue
                const pos = world.getPosition(handle)
                const layout = { x: pos.x, y: pos.y }
                toLayout.set(id, layout)
                // To-card enters from axis × -sign direction (origin side)
                const enterOffset = offsetFor((-sign) as -1 | 1)
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
            for (const id of [...targets.fromIds, ...targets.toIds]) {
                const handle = world.getHandleById(id)
                if (handle === undefined) continue
                world.setDragging(handle, false)
            }
            return true
        }
        return false
    }
}
