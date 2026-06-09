/**
 * The single home for the site's physics/transition feel constants.
 *
 * Shape rules (the Atelier physics axis regenerates this file whole):
 *   - One flat, mutable data literal — no computed values, no spreads.
 *   - Read-at-use: consumers read `physicsTuning.x` at the moment of use —
 *     per tick for gravity/stiffness, per event for fling/kick/transition
 *     timings — never captured into a closure or engine state at
 *     construction. This is what lets a dev slider act on a running world.
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
    /** How far past its anchor (along gravity) a card spawns, in px. */
    spawnOffsetPx: 20,
    /** Velocity kick along the buoyancy axis when a tether is cut on exit. */
    exitKick: 10,
    /** Delay after the exit primitive starts before the first card drops in. */
    pourInBaseDelayMs: 1000,
    /** Additional per-card delay between successive pour-in drops. */
    pourInStaggerMs: 80,
    /** Duration of one card's pour-in position tween. */
    pourInTweenMs: 600,
    /** Hard ceiling that finalizes any still-in-flight pour-in entries. */
    pourInHardCeilingMs: 2500,
    /** Hard ceiling that finalizes a string-cut drop still in flight. */
    stringCutHardCeilingMs: 2000,
    /** Duration of a coupled anchor-slide transition. */
    anchorSlideDurationMs: 700,
    /** Overlap between exit and enter primitives in a decoupled transition. */
    decoupledOverlapMs: 200,
    /** Cross-fade duration used when prefers-reduced-motion is set. */
    reducedMotionMs: 150,
}

export type PhysicsTuning = typeof physicsTuning
