/**
 * The home for the site's gravity, tether, and fling feel constants (the
 * dormant-gravity knobs plus the live tether + fling ones). Drift-mode
 * wander/damping/repel live in driftTuning.ts; peek dismissal timings in
 * peekTuning.ts.
 *
 * Shape rules (the Atelier physics axis regenerates this file whole):
 *   - One flat, mutable data literal — no computed values, no spreads.
 *   - Read-at-use: consumers read `physicsTuning.x` at the moment of use —
 *     per tick for gravity/stiffness, per event for fling — never captured
 *     into a closure or engine state at construction. This is what lets a
 *     dev slider act on a running world.
 *   - Tests import from this module; they never copy these literals.
 */
export const physicsTuning = {
    /** Gravity magnitude applied along the route's Cardinal direction. */
    gravityY: 0.7,
    /** Multiplier on the anti-gravity force applied to 'balloon' bodies. */
    buoyancyGain: 1.5,
    /**
     * Per-tick "acceleration scale" converting tether overshoot into a force
     * (multiplied by body mass at the apply site). The 1e-9-stiffness
     * matter.js constraint that used to back the tether was vestigial —
     * issue #108 cut it, so this number alone now drives rope physics.
     * Hand-tuned to match the behaviour cards exhibited in May 2026; do not
     * change without a matching pendulum-settle regression review.
     */
    tetherStiffness: 1.75e-5,
    /**
     * A tether is drawn slack (sagging bezier) when the parent–child
     * distance is below this fraction of its length. Single-sourced so rope
     * physics and StringLayer sag drawing move together.
     */
    slackFactor: 0.98,
    /** Pointer-velocity multiplier applied when a dragged card is released. */
    flingVelocityScale: 16,
    /** Pause longer than this before release and the fling is cancelled. */
    flingPauseMs: 50,
}

export type PhysicsTuning = typeof physicsTuning
