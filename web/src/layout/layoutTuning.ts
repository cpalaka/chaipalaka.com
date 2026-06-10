/**
 * The single home for the chain-layout constants (the Atelier chain axis
 * regenerates this file whole).
 *
 * Shape rules, matching physicsTuning.ts:
 *   - One flat, mutable data literal — no computed values, no spreads.
 *   - Read-at-use: consumers read `layoutTuning.x` when they partition or
 *     lay out a chain — never captured into a module-level computed const.
 *   - Tests import from this module; they never copy these literals.
 *
 * Unlike physics (read per tick), chain layout is pull-based: after
 * mutating values, call notifyLayoutTuning() so chain routes rebuild and
 * re-partition. Layout spacing guardrail: parent/child spacing must stay
 * ≥ card height + 60px — tether lengths derive from the layout.
 */
export const layoutTuning = {
    /** Vertical gap between stacked chain cards, edge to edge. */
    chainGap: 60,
    /** Y of the first chain card's top edge, below the physics ceiling. */
    chainTop: 80,
    /** Inline nav card width. */
    navCardW: 180,
    /** Inline nav card height. */
    navCardH: 56,
    /** Back-nav top edge sits this far below the ceiling. */
    navTopInset: 40,
    /** Next-nav bottom edge sits this far above the floor. */
    navBottomInset: 40,
}

export type LayoutTuning = typeof layoutTuning

const listeners = new Set<() => void>()

/** Chain routes re-partition on notify; the Atelier chain binding calls
 * this after writing new values onto the literal. */
export function notifyLayoutTuning(): void {
    for (const listener of listeners) listener()
}

export function subscribeLayoutTuning(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
