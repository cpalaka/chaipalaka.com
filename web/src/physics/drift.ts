import type { Rect, Vec2 } from './PhysicsWorld'

/**
 * Drift-mode force primitives (spec §1, run-and-tumble model — amended
 * 2026-07-03). Pure functions — the injectable RNG and content-box rect are
 * passed in, so PhysicsWorld stays the only stateful owner and these are
 * unit-testable in isolation.
 */

/**
 * One **run-and-tumble impulse** (spec §1): a single velocity kick in a
 * uniformly-random direction at a fixed `speed`, applied by the caller as a
 * **direct velocity add** (mass-invariant, like the prototype). No dt term — an
 * impulse is a discrete event, not a per-tick diffusion; dt-invariance comes
 * from the ms-based firing interval ({@link nextImpulseDelay}), not the
 * magnitude. RNG is injected (draws exactly one value — the direction angle) so
 * the pass is deterministic under test.
 */
export function driftImpulse(rng: () => number, speed: number): Vec2 {
    const angle = rng() * 2 * Math.PI
    return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
}

/**
 * The delay (ms) until a card's next run-and-tumble impulse: the mean interval
 * with uniform jitter across `[0.5×, 1.5×]` so cards desync and never cluster or
 * drought (spec §1). The world decrements it by `dtMs` each tick, so the firing
 * rate is refresh-rate-invariant. Draws exactly one RNG value.
 */
export function nextImpulseDelay(rng: () => number, meanMs: number): number {
    return meanMs * (0.5 + rng())
}

/**
 * The **prose repel** acceleration (spec §1): a gentle outward push from the
 * content-box rect with signed-distance falloff. Finite and outward-pointing
 * everywhere — outside (incl. corners → diagonal), on the edge, and inside the
 * rect (→ toward the nearest edge). Zero beyond `radius` from the box surface.
 * Returns an acceleration; the caller scales by mass at the apply site (the
 * tetherStiffness convention) so the pose is mass-invariant.
 */
export function proseRepelForce(
    pos: Vec2,
    rect: Rect,
    radius: number,
    strength: number,
): Vec2 {
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const dxc = pos.x - cx
    const dyc = pos.y - cy
    // Per-axis distance outside the box half-extent (>0 outside, <0 inside).
    const qx = Math.abs(dxc) - rect.width / 2
    const qy = Math.abs(dyc) - rect.height / 2

    const outDist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))

    let dirx: number
    let diry: number
    if (outDist > 0) {
        // Outside: outward = from the nearest point on the rect to the body.
        const nearX = Math.min(Math.max(pos.x, rect.x), rect.x + rect.width)
        const nearY = Math.min(Math.max(pos.y, rect.y), rect.y + rect.height)
        const dl = Math.hypot(pos.x - nearX, pos.y - nearY) || 1
        dirx = (pos.x - nearX) / dl
        diry = (pos.y - nearY) / dl
    } else if (qx >= qy) {
        // Inside, x-edge nearest: push out along x (default +x at dead centre).
        dirx = dxc >= 0 ? 1 : -1
        diry = 0
        if (dxc === 0) dirx = 1
    } else {
        // Inside, y-edge nearest: push out along y (default -y at dead centre).
        diry = dyc >= 0 ? 1 : -1
        dirx = 0
        if (dyc === 0) diry = -1
    }

    // Signed distance to the box surface: positive outside, negative inside.
    const signedDist = outDist + Math.min(Math.max(qx, qy), 0)
    const falloff = Math.max(0, Math.min(1, 1 - signedDist / radius))
    const mag = strength * falloff
    return { x: dirx * mag, y: diry * mag }
}
