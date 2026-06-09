import type {
    BodyDriver,
    PhysicsHandle,
    TetherSpec,
    Vec2,
} from '../../physics/BodyDriver'
import { physicsTuning } from '../../physics/physicsTuning'
import type { Viewport } from '../../physics/PhysicsWorld'
import type { CardActivator } from '../../card/CardRegistry'
import type { PrimitiveStep } from './types'

export interface PourInDropEntry {
    id: string
    layoutAnchor: { x: number; y: number }
    height: number
    staggerMs: number
}

export interface PourInDropOpts {
    viewport: Viewport
    hardCeilingMs?: number
    tweenDurationMs?: number
}

const ABOVE_VIEWPORT_PAD = 220

interface EntryState {
    handle: PhysicsHandle
    captured?: TetherSpec
    startPos: Vec2
    tweenStartMs: number // -1 until the per-entry stagger has elapsed
    finalized: boolean
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

/**
 * Drops new cards into place from above the viewport using a **kinematic
 * position tween**.
 *
 * Why kinematic and not "let gravity + tether do it":
 *   The default tether stiffness (`physicsTuning.tetherStiffness`)
 *   is calibrated for cards hanging at rest with tiny perturbations. It is too
 *   soft to decelerate a card that has free-fallen from above the viewport, so
 *   handing physics the catch produces cards that sail right through their
 *   layout y and exit the bottom. Driving the position directly (via
 *   `setDragging`) lets us animate the drop, then hand the body back to physics
 *   at rest exactly at its anchor where the existing tether will hold it.
 *
 * Per-entry flow:
 *   - Wait `staggerMs` from primitive start.
 *   - Capture and untether any existing tether (we re-wire it after the tween).
 *   - `setDragging(handle, true)` — body becomes static, so the tween isn't
 *     fighting gravity/buoyancy.
 *   - Position the body just above the viewport at the card's layout x.
 *   - Each tick, lerp from above-viewport → `layoutAnchor` over
 *     `tweenDurationMs` with an ease-out-cubic.
 *   - When the tween completes: `setDragging(false)`, zero the velocity,
 *     reattach the captured tether (if any).
 *
 * Hard-ceiling fallback finalizes every still-in-flight entry at its anchor.
 */
export function pourInDrop(
    driver: BodyDriver,
    activator: CardActivator,
    entries: readonly PourInDropEntry[],
    opts: PourInDropOpts,
): PrimitiveStep {
    // Resolved at primitive construction, which happens per transition
    // event — a tuning change applies from the next navigation on.
    const hardCeilingMs = opts.hardCeilingMs ?? physicsTuning.pourInHardCeilingMs
    const tweenDurationMs = opts.tweenDurationMs ?? physicsTuning.pourInTweenMs

    let elapsedMs = 0
    let preSpawned = false
    const state = new Map<string, EntryState>()

    // On the primitive's first tick, hide every entry above the viewport
    // immediately so the cards never flash at their layout positions during
    // the per-entry stagger delay.
    const preSpawnAll = () => {
        for (const entry of entries) {
            if (state.has(entry.id)) continue
            const handle = driver.getHandleById(entry.id)
            if (handle === undefined) continue

            const captured = driver.detachTetherOf(handle)

            const startPos: Vec2 = {
                x: entry.layoutAnchor.x,
                y: -entry.height - ABOVE_VIEWPORT_PAD,
            }
            driver.setDragging(handle, true)
            driver.setPosition(handle, startPos)
            activator.activate(entry.id)

            state.set(entry.id, {
                handle,
                ...(captured ? { captured } : {}),
                startPos,
                tweenStartMs: -1,
                finalized: false,
            })
        }
    }

    const finalize = (entry: PourInDropEntry, s: EntryState) => {
        if (s.finalized) return
        if (!driver.has(s.handle)) {
            s.finalized = true
            return
        }
        driver.setPosition(s.handle, entry.layoutAnchor)
        driver.setDragging(s.handle, false)
        driver.setVelocity(s.handle, { x: 0, y: 0 })
        if (s.captured) driver.attachTether(s.captured)
        s.finalized = true
    }

    const updateEntry = (entry: PourInDropEntry) => {
        const s = state.get(entry.id)
        if (!s || s.finalized) return
        if (!driver.has(s.handle)) {
            s.finalized = true
            return
        }
        // Hold the entry above the viewport until its stagger fires. Anchor
        // tweenStartMs to the stagger boundary (not the current elapsedMs) so
        // the tween's first visible tick already shows some progress.
        if (s.tweenStartMs < 0) {
            if (elapsedMs < entry.staggerMs) return
            s.tweenStartMs = entry.staggerMs
        }
        const t = Math.min((elapsedMs - s.tweenStartMs) / tweenDurationMs, 1)
        if (t >= 1) {
            finalize(entry, s)
            return
        }
        const eased = easeOutCubic(t)
        driver.setPosition(s.handle, {
            x: s.startPos.x + (entry.layoutAnchor.x - s.startPos.x) * eased,
            y: s.startPos.y + (entry.layoutAnchor.y - s.startPos.y) * eased,
        })
    }

    return (dtMs) => {
        elapsedMs += dtMs

        if (!preSpawned) {
            preSpawnAll()
            preSpawned = true
        }
        for (const entry of entries) updateEntry(entry)

        if (elapsedMs >= hardCeilingMs) {
            // Emergency finalize anything mid-flight. Entries that never
            // started (stagger > ceiling) are left alone — their tether is
            // still attached and the body is untouched.
            for (const entry of entries) {
                const s = state.get(entry.id)
                if (s && !s.finalized) finalize(entry, s)
            }
            return true
        }

        return entries.every((e) => state.get(e.id)?.finalized === true)
    }
}
