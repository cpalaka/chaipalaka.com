export function computeSpawnOffset(
    anchor: { x: number; y: number },
    gravity: { x: number; y: number },
    offsetPx: number,
): { x: number; y: number } {
    const gLen = Math.hypot(gravity.x, gravity.y)
    const gx = gLen > 0 ? gravity.x / gLen : 0
    const gy = gLen > 0 ? gravity.y / gLen : 1
    return { x: anchor.x + gx * offsetPx, y: anchor.y + gy * offsetPx }
}
