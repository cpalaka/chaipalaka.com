/**
 * Per-word **wobble** (spec §5 / §15; AC#3): a subtle, transform-only damped
 * oscillator driven by the hanging card's pull, so the source word reads as if it
 * "has weight hanging off it." Built from scratch — **not** `@chenglou/pretext`
 * (which is measurement-only). The caller applies the result as a `transform` on
 * a single `<span>` wrapping the whole word, never per-glyph, so screen readers,
 * text selection, and copy-paste see unchanged text (PRD:381).
 *
 * A damped spring with a drive term: steady state under a constant pull is
 * `drive / stiffness` (a slight lean toward the card); a disturbance jiggles and
 * settles. Semi-implicit (symplectic) Euler — stable across the rAF dt clamp.
 * Pure: `(state, drive, dt) → state`.
 */

export interface WobbleState {
    x: number
    y: number
    vx: number
    vy: number
}

export interface WobbleConfig {
    stiffness: number
    damping: number
}

export const REST: WobbleState = { x: 0, y: 0, vx: 0, vy: 0 }

export function stepWobble(
    s: WobbleState,
    drive: { x: number; y: number },
    dtMs: number,
    cfg: WobbleConfig,
): WobbleState {
    const dt = dtMs / 1000
    const ax = drive.x - cfg.stiffness * s.x - cfg.damping * s.vx
    const ay = drive.y - cfg.stiffness * s.y - cfg.damping * s.vy
    const vx = s.vx + ax * dt
    const vy = s.vy + ay * dt
    return { vx, vy, x: s.x + vx * dt, y: s.y + vy * dt }
}
