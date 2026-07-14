/**
 * Pure per-frame packing logic for the one-way physics→GPU aura bridge
 * (task-038 S2). Factored out of `AuraScene`'s `useFrame` so the slot-fill rule
 * — active card rects up front, every remaining slot parked far off-screen — is
 * unit-testable without standing up a WebGPU renderer (jsdom can't).
 *
 * `PhysicsWorld.snapshotCardRects` writes `[cx, cy, halfW, halfH]` per card into
 * a flat Float32Array (viewport CSS px) and returns the count. This walks all
 * `maxCards` GPU slots and hands each one its four floats through `write`, so the
 * caller mutates its pre-allocated uniform vectors in place with zero allocation.
 */

/** Sentinel centre (px) for an inactive slot: far off any viewport, zero-sized,
 *  so even if the shader's count-gate were removed the parked rect's SDF would
 *  contribute nothing to the smin field. */
export const AURA_PARK_SENTINEL = -1e5

/**
 * Distribute a `snapshotCardRects` result across `maxCards` GPU slots.
 * Slots `[0, count)` get their card's `[cx, cy, halfW, halfH]` and `[cos, sin]`
 * rotation; slots `[count, maxCards)` are parked
 * (`AURA_PARK_SENTINEL, AURA_PARK_SENTINEL, 0, 0` + identity rotation).
 * `count` is clamped to `[0, maxCards]` defensively (the snapshot already caps at
 * the buffer capacity, which the caller sizes to `maxCards * 4` / `maxCards * 2`).
 */
export function writeAuraRects(
    buf: Float32Array,
    rotBuf: Float32Array,
    count: number,
    maxCards: number,
    write: (slot: number, x: number, y: number, z: number, w: number) => void,
    writeRot: (slot: number, cos: number, sin: number) => void,
): void {
    const active = Math.max(0, Math.min(count, maxCards))
    for (let i = 0; i < maxCards; i++) {
        if (i < active) {
            const b = i * 4
            write(i, buf[b]!, buf[b + 1]!, buf[b + 2]!, buf[b + 3]!)
            writeRot(i, rotBuf[i * 2]!, rotBuf[i * 2 + 1]!)
        } else {
            write(i, AURA_PARK_SENTINEL, AURA_PARK_SENTINEL, 0, 0)
            writeRot(i, 1, 0)
        }
    }
}
