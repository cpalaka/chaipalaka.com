import type { BodyDriver, PhysicsHandle } from '../../physics/BodyDriver'
import type { Viewport } from '../../physics/PhysicsWorld'
import type { PrimitiveStep } from './types'

export interface StringCutDropOpts {
    viewport: Viewport
    /**
     * Edge handle to flip to sensor mode for the duration of the drop, so
     * exiting cards fall straight through without collision. The director
     * resolves this from the world's `floorHandle` so the primitive doesn't
     * need to know world identity.
     */
    floorHandle: PhysicsHandle
    hardCeilingMs?: number
}

const DEFAULT_HARD_CEILING_MS = 2000
// Pad past the viewport edge before a card is considered "cleared". Without
// this, cards are released the instant their top edge dips below the viewport
// bottom and the disappear looks abrupt.
const CLEAR_PAD = 100
// Velocity kick applied along the buoyancy direction the moment the tether is
// cut, so exiting cards leave the viewport with momentum rather than slowly
// peeling away under gravity alone.
const EXIT_KICK = 10

export function stringCutDrop(
    driver: BodyDriver,
    cardIds: readonly string[],
    opts: StringCutDropOpts,
): PrimitiveStep {
    const hardCeilingMs = opts.hardCeilingMs ?? DEFAULT_HARD_CEILING_MS
    const { viewport, floorHandle } = opts

    let elapsedMs = 0
    let initialized = false
    let finalized = false

    const exitingHandles = new Set<PhysicsHandle>()

    const finalize = () => {
        if (finalized) return
        finalized = true
        driver.setSensor(floorHandle, false)
    }

    return (dtMs) => {
        if (!initialized) {
            for (const id of cardIds) {
                const h = driver.getHandleById(id)
                if (h !== undefined) exitingHandles.add(h)
            }
            // For each exiting card, detach its tether and decide whether to
            // reattach. Discard if:
            //   - parent is static (ceiling/floor): tether is severed permanently;
            //   - parent is also in exitingHandles: parent will unregister moments
            //     later when its route unmounts, so a reattached tether would
            //     point at a dead handle and throw on the next physics tick.
            // Otherwise (dynamic parent that survives the transition) reattach
            // so the child keeps swinging from its parent during the drop.
            for (const handle of exitingHandles) {
                const spec = driver.detachTetherOf(handle)
                if (!spec) continue
                if (driver.isStatic(spec.parent)) continue
                if (exitingHandles.has(spec.parent)) continue
                driver.attachTether(spec)
            }
            // Switch the floor to a sensor: exiting cards fall straight through
            // without collision, while incoming cards' floor-anchored tethers
            // (e.g. next-nav trail) keep their existing length. Earlier the
            // floor body was teleported below the viewport, but that
            // body-relative repositioning made any tether whose anchorA was
            // body-relative overshoot massively for the duration of the
            // transition, dragging the entire incoming chain downward.
            driver.setSensor(floorHandle, true)
            // Snap-kick: launch each exiting card along its buoyancy axis so
            // the drop feels deliberate rather than lethargic.
            const g = driver.getGravityVector()
            const gLen = Math.hypot(g.x, g.y)
            const gx = gLen > 0 ? g.x / gLen : 0
            const gy = gLen > 0 ? g.y / gLen : 1
            for (const handle of exitingHandles) {
                const sign = driver.getBuoyancy(handle) === 'balloon' ? -1 : 1
                const v = driver.getVelocity(handle)
                driver.setVelocity(handle, {
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
            const handle = driver.getHandleById(id)
            if (handle === undefined) return true
            const pos = driver.getPosition(handle)
            const size = driver.getSize(handle)
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
