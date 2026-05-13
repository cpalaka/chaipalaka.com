import type {
    PhysicsHandle,
    PhysicsWorld,
    Vec2,
    Viewport,
} from '../../physics/PhysicsWorld'
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

const DEFAULT_HARD_CEILING_MS = 2500
const DEFAULT_TWEEN_DURATION_MS = 600
const ABOVE_VIEWPORT_PAD = 220

interface CapturedTether {
    parent: PhysicsHandle
    length: number
    anchorA?: Vec2
}

interface EntryState {
    handle: PhysicsHandle
    captured?: CapturedTether
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
 *   The default tether stiffness in `PhysicsWorld` (`TETHER_STIFFNESS = 1.75e-5`)
 *   is calibrated for cards hanging at rest with tiny perturbations. It is too
 *   soft to decelerate a card that has free-fallen from above the viewport, so
 *   handing physics the catch produces cards that sail right through their
 *   layout y and exit the bottom. Driving the position directly (via
 *   `setStatic`) lets us animate the drop, then hand the body back to physics
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
    world: PhysicsWorld,
    entries: readonly PourInDropEntry[],
    opts: PourInDropOpts,
): PrimitiveStep {
    const hardCeilingMs = opts.hardCeilingMs ?? DEFAULT_HARD_CEILING_MS
    const tweenDurationMs = opts.tweenDurationMs ?? DEFAULT_TWEEN_DURATION_MS

    let elapsedMs = 0
    let preSpawned = false
    const state = new Map<string, EntryState>()

    // On the primitive's first tick, hide every entry above the viewport
    // immediately so the cards never flash at their layout positions during
    // the per-entry stagger delay.
    const preSpawnAll = () => {
        for (const entry of entries) {
            if (state.has(entry.id)) continue
            const handle = world.getHandleById(entry.id)
            if (handle === undefined) continue

            let captured: CapturedTether | undefined
            for (const t of world.tether.records()) {
                if (t.child !== handle) continue
                captured = {
                    parent: t.parent,
                    length: t.length,
                    ...(t.anchorA ? { anchorA: { ...t.anchorA } } : {}),
                }
                world.tether.remove(t.handle)
                break
            }

            const startPos: Vec2 = {
                x: entry.layoutAnchor.x,
                y: -entry.height - ABOVE_VIEWPORT_PAD,
            }
            world.setDragging(handle, true)
            world.setPosition(handle, startPos)

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
        if (!world.has(s.handle)) {
            s.finalized = true
            return
        }
        world.setPosition(s.handle, entry.layoutAnchor)
        world.setDragging(s.handle, false)
        world.setVelocity(s.handle, { x: 0, y: 0 })
        if (s.captured) {
            world.tether.add(
                s.captured.parent,
                s.handle,
                s.captured.length,
                s.captured.anchorA,
            )
        }
        s.finalized = true
    }

    const updateEntry = (entry: PourInDropEntry) => {
        const s = state.get(entry.id)
        if (!s || s.finalized) return
        if (!world.has(s.handle)) {
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
        world.setPosition(s.handle, {
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
