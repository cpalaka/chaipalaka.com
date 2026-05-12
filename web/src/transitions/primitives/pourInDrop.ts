import type { PhysicsWorld, Viewport } from '../../physics/PhysicsWorld'
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
    spawnVelocityY?: number
    velocitySettleThreshold?: number
}

const DEFAULT_HARD_CEILING_MS = 1500
const DEFAULT_SPAWN_VELOCITY_Y = 4
const DEFAULT_VELOCITY_SETTLE = 0.2

export function pourInDrop(
    world: PhysicsWorld,
    entries: readonly PourInDropEntry[],
    opts: PourInDropOpts,
): PrimitiveStep {
    const hardCeilingMs = opts.hardCeilingMs ?? DEFAULT_HARD_CEILING_MS
    const spawnVy = opts.spawnVelocityY ?? DEFAULT_SPAWN_VELOCITY_Y
    const settleThreshold = opts.velocitySettleThreshold ?? DEFAULT_VELOCITY_SETTLE

    let elapsedMs = 0
    const spawned = new Set<string>()
    const settled = new Set<string>()

    const trySpawn = (entry: PourInDropEntry) => {
        if (spawned.has(entry.id)) return
        if (elapsedMs < entry.staggerMs) return
        const handle = world.getHandleById(entry.id)
        if (handle === undefined) return
        world.setPosition(handle, {
            x: entry.layoutAnchor.x,
            y: -entry.height - 20,
        })
        world.setVelocity(handle, { x: 0, y: spawnVy })
        spawned.add(entry.id)
    }

    return (dtMs) => {
        elapsedMs += dtMs

        for (const entry of entries) trySpawn(entry)

        if (elapsedMs >= hardCeilingMs) return true

        for (const entry of entries) {
            if (!spawned.has(entry.id) || settled.has(entry.id)) continue
            const handle = world.getHandleById(entry.id)
            if (handle === undefined) {
                settled.add(entry.id)
                continue
            }
            const v = world.getVelocity(handle)
            const speed = Math.hypot(v.x, v.y)
            if (speed < settleThreshold && elapsedMs > entry.staggerMs + 100) {
                settled.add(entry.id)
            }
        }

        return entries.every((e) => settled.has(e.id))
    }
}
