/**
 * Random exit impulse for a dismissed preview (task-036), confined to a 90° cone
 * pointing UP — toward the ceiling (screen-up is negative y). rng∈[0,1) maps to an
 * angle ±45° off straight-up, so the magnitude is always `speed`, vy is always
 * negative (upward), and vx sweeps the cone (|vx| ≤ speed·sin45°). Route gravity
 * then acts on the launched body. The rng is injected (default `Math.random` at
 * the call site) so the frozen-body test can assert direction + magnitude
 * deterministically.
 */
export function computeFlingVelocity(
    rng: () => number,
    speed: number,
): { x: number; y: number } {
    const offset = (rng() - 0.5) * (Math.PI / 2) // ±45° from straight up
    return { x: Math.sin(offset) * speed, y: -Math.cos(offset) * speed }
}
