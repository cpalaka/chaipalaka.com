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
}

export type PinTuning = typeof pinTuning
