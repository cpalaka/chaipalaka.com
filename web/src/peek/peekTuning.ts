/**
 * Feel constants for the v2 **Peek** rung (the first ladder rung — hover/tap a
 * Portal/Pocket link → an ephemeral preview card beside the word).
 *
 * Lives in its own flat literal rather than `physicsTuning.ts` on purpose: the
 * Atelier regenerates `physicsTuning.ts` whole from its schema, which would drop
 * any field the schema doesn't know about. Keeping Peek's interaction constants
 * here keeps them read-at-use and safe from that write-back. (When Peek earns an
 * Atelier axis, this module gets wired the way `layoutTuning.ts` is.)
 *
 * Read-at-use, like the other tuning literals: consumers read `peekTuning.x` at
 * the moment of use, never capture it at construction. Tests import this module;
 * they never copy these numbers.
 */
export const peekTuning = {
    /** Hover dwell before a desktop peek fires (ms). */
    dwellMs: 250,
    /** Max cursor movement during the dwell window before it resets (px). */
    dwellStillPx: 4,
    /** Dwell-progress hint reveals only after this long (ms) — barely-there on a real peek. */
    dwellProgressDelayMs: 120,
    /** Safe-triangle bridge keeps the card alive this long off the direct path (ms). */
    bridgeGraceMs: 300,
    /** A scroll smaller than this is ignored before scroll-dismiss fires (px). */
    scrollDismissGracePx: 8,
    /** Preview card width (px). Height is content-driven, clamped to the viewport. */
    previewWidth: 300,
    /** Gap between the source word and the preview card (px). */
    previewGapPx: 12,
    /** Min distance the preview keeps from a viewport edge (px). */
    previewMarginPx: 12,
    /** Safety cap on a dismissed preview's lifetime (ms). It is normally removed
     * the instant it clears the viewport; this only bounds a card that never exits. */
    fallMs: 4000,
    /** Exit-kick speed when a dismissed preview is flung up (toward the ceiling). */
    fallKick: 18,
}

export type PeekTuning = typeof peekTuning
