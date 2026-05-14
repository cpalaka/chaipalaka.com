export function computeFlingImpulse(
    delta: { dx: number; dy: number; dtMs: number },
    sinceLastMoveMs: number,
    config: { scale: number; pauseMs: number },
): { vx: number; vy: number } {
    if (sinceLastMoveMs > config.pauseMs) return { vx: 0, vy: 0 }
    const dt = Math.max(delta.dtMs, 1)
    return {
        vx: (delta.dx / dt) * config.scale,
        vy: (delta.dy / dt) * config.scale,
    }
}
