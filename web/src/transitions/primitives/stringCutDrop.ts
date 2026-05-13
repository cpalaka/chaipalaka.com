import type { PhysicsHandle, PhysicsWorld, Vec2, Viewport } from '../../physics/PhysicsWorld'
import type { PrimitiveStep } from './types'

export interface StringCutDropOpts {
    viewport: Viewport
    hardCeilingMs?: number
}

const DEFAULT_HARD_CEILING_MS = 2000
const PHANTOM_FLOOR_OFFSET = 1000
// Pad past the viewport edge before a card is considered "cleared". Without
// this, cards are released the instant their top edge dips below the viewport
// bottom and the disappear looks abrupt.
const CLEAR_PAD = 100
// Velocity kick applied along the buoyancy direction the moment the tether is
// cut, so exiting cards leave the viewport with momentum rather than slowly
// peeling away under gravity alone.
const EXIT_KICK = 10

export function stringCutDrop(
    world: PhysicsWorld,
    cardIds: readonly string[],
    opts: StringCutDropOpts,
): PrimitiveStep {
    const hardCeilingMs = opts.hardCeilingMs ?? DEFAULT_HARD_CEILING_MS
    const { viewport } = opts

    let elapsedMs = 0
    let initialized = false
    let savedFloorAnchor: Vec2 | null = null
    let finalized = false

    const exitingHandles = new Set<PhysicsHandle>()

    const finalize = () => {
        if (finalized) return
        finalized = true
        if (savedFloorAnchor) {
            world.setAnchor(world.floorHandle, savedFloorAnchor)
        }
    }

    return (dtMs) => {
        if (!initialized) {
            for (const id of cardIds) {
                const h = world.getHandleById(id)
                if (h !== undefined) exitingHandles.add(h)
            }
            // Cut only tethers belonging to *exiting* cards whose parent is the
            // ceiling or floor. Leaves new (incoming) cards' tethers intact so
            // they remain strung during the transition.
            for (const t of world.listTetherRecords()) {
                if (
                    (t.parent === world.ceilingHandle ||
                        t.parent === world.floorHandle) &&
                    exitingHandles.has(t.child)
                ) {
                    world.untether(t.handle)
                }
            }
            // Phantom floor: push beyond viewport so exiting cards can fall
            // past the visible area. Saved so we can restore on completion —
            // without this, every subsequent navigation runs with a lowered floor.
            savedFloorAnchor = world.getAnchor(world.floorHandle)
            world.setAnchor(world.floorHandle, {
                x: savedFloorAnchor.x,
                y: viewport.height + PHANTOM_FLOOR_OFFSET,
            })
            // Snap-kick: launch each exiting card along its buoyancy axis so
            // the drop feels deliberate rather than lethargic.
            const g = world.getGravityVector()
            const gLen = Math.hypot(g.x, g.y)
            const gx = gLen > 0 ? g.x / gLen : 0
            const gy = gLen > 0 ? g.y / gLen : 1
            for (const handle of exitingHandles) {
                const sign = world.getBuoyancy(handle) === 'balloon' ? -1 : 1
                const v = world.getVelocity(handle)
                world.setVelocity(handle, {
                    x: v.x + gx * EXIT_KICK * sign,
                    y: v.y + gy * EXIT_KICK * sign,
                })
            }
            initialized = true
        }

        elapsedMs += dtMs

        if (elapsedMs >= hardCeilingMs) {
            finalize()
            return true
        }

        // A card is "cleared" only when its full bounding box is comfortably
        // past the viewport edge — top edge >= viewport.height + pad (for heavy
        // fall) or bottom edge <= -pad (for balloon rise).
        const allCleared = cardIds.every((id) => {
            const handle = world.getHandleById(id)
            if (handle === undefined) return true
            const pos = world.getPosition(handle)
            const size = world.getSize(handle)
            const top = pos.y - size.height / 2
            const bottom = pos.y + size.height / 2
            return top > viewport.height + CLEAR_PAD || bottom < -CLEAR_PAD
        })
        if (allCleared) {
            finalize()
            return true
        }
        return false
    }
}
