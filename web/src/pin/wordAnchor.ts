/**
 * The word-anchored scroll-tracking step (spec §5; spike guardrails G1 + G4).
 *
 * A pinned card hangs from a **word-anchor proxy** — a static body placed at the
 * source word's viewport-space centre and moved to follow it every frame. The
 * spike proved the stable mechanism is **translate-pair (G1)**: the anchor tracks
 * the real word *exactly* (no per-frame motion clamp) and the card body is
 * translated by the *same* delta, so the rope vector stays scroll-invariant
 * (overshoot holds at rest values at any scroll speed — a fling reads like
 * standing still). **G4**: a word mid-CSS-transform or `display:none` yields a
 * non-finite `getBoundingClientRect`; feeding that into the delta NaN-poisons the
 * tether force in one frame, so a non-finite rect skips the frame entirely.
 *
 * Pure: the caller reads `getBoundingClientRect`, calls `trackWord`, then sets
 * the anchor body to `anchor` and translates the card by `delta`.
 */

export interface Vec2 {
    x: number
    y: number
}

export interface WordRect {
    left: number
    top: number
    width: number
    height: number
}

function isFiniteRect(r: WordRect): boolean {
    return (
        Number.isFinite(r.left) &&
        Number.isFinite(r.top) &&
        Number.isFinite(r.width) &&
        Number.isFinite(r.height)
    )
}

/**
 * Compute the new anchor position (word centre, viewport space) and the
 * translate-pair delta from the previous anchor. Returns `null` when the rect is
 * non-finite (G4 — the caller skips the frame). `prev === null` is the first
 * frame: anchor placed, zero delta.
 */
export function trackWord(
    prev: Vec2 | null,
    rect: WordRect,
): { anchor: Vec2; delta: Vec2 } | null {
    if (!isFiniteRect(rect)) return null
    const anchor = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    const delta = prev
        ? { x: anchor.x - prev.x, y: anchor.y - prev.y }
        : { x: 0, y: 0 }
    return { anchor, delta }
}
