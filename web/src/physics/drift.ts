import type { Rect, Vec2 } from './PhysicsWorld'

/**
 * Drift-mode force primitives (spec §1). Pure functions — the injectable-RNG
 * and content-box rect are passed in, so PhysicsWorld stays the only stateful
 * owner and these are unit-testable in isolation.
 */

/**
 * The reference tick (matter.js's internal `Engine.update` baseline, 60fps).
 * The Brownian kick is normalised against it so wander statistics are
 * refresh-rate-invariant (spec §1: `sqrt(dt / 16.667)`).
 */
export const DRIFT_REF_TICK_MS = 1000 / 60

/**
 * One tick's Brownian velocity kick (spec §1): a dt-normalised random velocity
 * delta, `amplitude × sqrt(dt/refTick) × rand()` per component with
 * `rand() ∈ [-1, 1]`. Applied as a **direct velocity add** (not a force), so it
 * is inherently mass-invariant and the `sqrt(dt)` scaling gives dt-invariant
 * diffusion — matter's `applyForce` integrates `Δv ∝ dt²`, which cannot. RNG is
 * injected so the pass is deterministic under test.
 */
export function brownianKick(
    rng: () => number,
    dtMs: number,
    amplitude: number,
): Vec2 {
    const scale = amplitude * Math.sqrt(dtMs / DRIFT_REF_TICK_MS)
    return { x: (rng() * 2 - 1) * scale, y: (rng() * 2 - 1) * scale }
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
