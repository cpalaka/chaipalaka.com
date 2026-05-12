import type { PhysicsWorld, Viewport } from '../../physics/PhysicsWorld'
import type { PrimitiveStep } from './types'

export interface StringCutDropOpts {
    viewport: Viewport
    hardCeilingMs?: number
}

const DEFAULT_HARD_CEILING_MS = 1200
const PHANTOM_FLOOR_OFFSET = 200

export function stringCutDrop(
    world: PhysicsWorld,
    cardIds: readonly string[],
    opts: StringCutDropOpts,
): PrimitiveStep {
    const hardCeilingMs = opts.hardCeilingMs ?? DEFAULT_HARD_CEILING_MS
    const { viewport } = opts

    let elapsedMs = 0
    let initialized = false

    return (dtMs) => {
        if (!initialized) {
            // Cut all tethers whose parent is the ceiling or floor.
            const tethers = world.listTetherRecords()
            for (const t of tethers) {
                if (
                    t.parent === world.ceilingHandle ||
                    t.parent === world.floorHandle
                ) {
                    world.untether(t.handle)
                }
            }
            // Phantom floor: push beyond viewport so cards can exit downward.
            const floorPos = world.getPosition(world.floorHandle)
            world.setAnchor(world.floorHandle, {
                x: floorPos.x,
                y: viewport.height + PHANTOM_FLOOR_OFFSET,
            })
            initialized = true
        }

        elapsedMs += dtMs

        if (elapsedMs >= hardCeilingMs) return true

        // Per-card completion: heavy cards past viewport-bottom, balloons above -cardHeight.
        const allCleared = cardIds.every((id) => {
            const handle = world.getHandleById(id)
            if (handle === undefined) return true
            const pos = world.getPosition(handle)
            return pos.y > viewport.height + 100 || pos.y < -100
        })
        return allCleared
    }
}
