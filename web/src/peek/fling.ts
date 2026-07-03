/**
 * Random exit impulse for a dismissed preview (drift model, DRAFT-010 §3.4): a
 * *slight, any-direction* fling that nudges the card off its held position while
 * it fades out. `rng∈[0,1)` maps to a full-circle angle (`rng·2π`), so the
 * magnitude is always `speed` and the direction is isotropic — no gravity to
 * pull it anywhere, so no upward bias (the pre-drift version aimed a 90° cone at
 * the ceiling; drift routes run gravity {0,0}). The rng is injected (default
 * `Math.random` at the call site) so the test can assert direction + magnitude
 * deterministically.
 */
export function computeFlingVelocity(
    rng: () => number,
    speed: number,
): { x: number; y: number } {
    const angle = rng() * (Math.PI * 2)
    return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
}
