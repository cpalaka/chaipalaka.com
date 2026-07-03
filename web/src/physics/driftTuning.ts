/**
 * Drift-mode feel constants (spec §1 / D7). A separate module from
 * `physicsTuning.ts` **on purpose**: the Atelier physics axis regenerates
 * `physicsTuning.ts` whole, which would silently drop any field not in its zod
 * schema. These are read-at-use (per tick, inside `PhysicsWorld.tick`), never
 * captured at construction, so a future HMR/Atelier drift axis can act on a
 * running world — the `frictionAir` re-sync in the drift force pass is what
 * keeps that promise for the one registration-time knob (`damping`).
 *
 * Values are placeholder starters — the S4 feel pass tunes them in-session
 * (visual/feel AC). Keep `damping` well under the frictionAir NaN-inversion
 * margin (frictionAir·(dt/16.667) must stay < 2; with the 50ms dt clamp that
 * is frictionAir < ~0.66).
 */
export const driftTuning = {
    /** Glide-start speed of one run-and-tumble impulse (px/tick), scaled by driftScale. */
    impulseSpeed: 1.2,
    /** Mean ms between a card's impulses (uniform-jittered ±50% per fire, so cards desync). */
    impulseIntervalMs: 15000,
    /** Per-body `frictionAir` under drift — low drag so glides coast far before resting (replaces the 0.005 gravity default). */
    damping: 0.01,
    /** Distance (px) from the content-box surface over which prose repel falls to zero. */
    repelRadius: 120,
    /** Peak prose-repel acceleration at the box surface (scaled by mass at the apply site). */
    repelStrength: 2e-4,
}

export type DriftTuning = typeof driftTuning
