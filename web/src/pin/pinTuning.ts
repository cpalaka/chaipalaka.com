/**
 * Feel constants for the v2 **Keep** rung (slice 4 — press-hold a preview's title
 * bar to pin it into a persistent physics card strung to its source word).
 *
 * Lives in its own flat literal rather than `physicsTuning.ts` on purpose (same
 * reason as `peekTuning.ts`): the Atelier regenerates `physicsTuning.ts` whole
 * from its schema and would drop any field the schema doesn't know about. Keeping
 * Keep's interaction/feel constants here keeps them read-at-use and safe from that
 * write-back. (When Keep earns an Atelier axis, this module gets wired the way
 * `layoutTuning.ts` is.) Tests import this module; they never copy these numbers.
 */

export const pinTuning = {
    /** Press-hold on the title bar this long arms the keep gesture (ms). */
    armPressMs: 200,
    /** ...or a drag past this distance arms it immediately (px). */
    armMovePx: 6,
    /** Invisible title-bar hit-pad height so a preview isn't a sliver (px, spec §4). */
    titleBarHitPx: 28,

    /** Word-wobble spring (transform-only damped oscillator on the source word). */
    wobbleStiffness: 220,
    wobbleDamping: 13,
    /** Card-velocity → wobble drive scale: ~0 at rest, a visible (few-px) jiggle on
     * a swing. Velocity-driven (not overshoot) so the word never gets a permanent
     * downward lean — it only reacts when the hanging card actually moves. */
    wobbleDriveGain: 200,
    /** Clamp on the wobble drive so a hard fling can't over-throw the word
     * (≈ wobbleMaxDrive/wobbleStiffness px steady-state ceiling). */
    wobbleMaxDrive: 900,

    /** Scroll regimes (slice 5 — task-024). */
    /** Hysteresis deadband (px) past a fold edge before a card auto-parks, so a
     * word straddling the edge can't thrash the regime (spike G3 / scrollRegime). */
    foldMarginPx: 24,
    /** Park-rope rest clearance (px): added to the card half-height to set the
     * parked edge-rope's rest length, so the card floats just clear of the box
     * edge it docks to (parked rest = card half-height + this). Under drift the
     * pull-only rope caps distance and prose repel holds the card off the edge —
     * no gravity "hang" (spec §3.3). */
    parkGapPx: 8,
    /** Per-16.7ms exponential factor for easing a tether length to taut on
     * auto-park and on recall — the snap-to-edge / ease-home motion. ~0.2
     * settles in ~250ms (the spec's 200–300ms band). Reduced-motion skips it. */
    snapEaseRate: 0.2,
}

export type PinTuning = typeof pinTuning
