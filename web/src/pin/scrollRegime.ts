/**
 * The pinned-card **anchor-regime** state machine (spec §5; spike G3).
 *
 * A pinned card is in one of two regimes: **word-anchored** (its tether hangs
 * from the source word and tracks scroll, see `wordAnchor.ts`) or
 * **edge-anchored** — "parked" at the content box's top or bottom edge. This
 * pure step decides the *automatic* transition only: word → parked **auto-park**
 * when the word scrolls past the fold (the box's visible region), latching at the
 * edge it exited through. The reverse (parked → word, **recall**) is never
 * automatic — it is a manual click — so the machine is *sticky once parked* and
 * only reports `recallable` (the word is back in the fold) for the caller to act
 * on. That asymmetry is the spike's one-way **hysteresis** (G3): nothing here can
 * yo-yo a card across the boundary.
 *
 * Pure: the caller measures the word centre + the fold (viewport space) and feeds
 * them in each frame; on a manual recall click it sets the regime back to `'word'`
 * itself (the only parked → word transition — never automatic).
 */

export type Regime = 'word' | 'parked-top' | 'parked-bottom'

/** The content box's visible region in viewport space — the "fold". */
export interface Fold {
    top: number
    bottom: number
}

export interface RegimeStep {
    regime: Regime
    /** True on the single frame the regime auto-parks (word → parked). */
    justParked: boolean
    /** Parked AND the word is back inside the fold — offer manual recall. */
    recallable: boolean
}

/**
 * Advance the regime for one frame. `wordCenterY` is the source word's vertical
 * centre (viewport space); `fold` is the box's visible top/bottom; `margin` is a
 * hysteresis deadband so a word straddling an edge does not park on a jitter.
 */
export function stepRegime(
    regime: Regime,
    wordCenterY: number,
    fold: Fold,
    margin: number,
): RegimeStep {
    if (regime === 'word') {
        if (wordCenterY < fold.top - margin) {
            return { regime: 'parked-top', justParked: true, recallable: false }
        }
        if (wordCenterY > fold.bottom + margin) {
            return { regime: 'parked-bottom', justParked: true, recallable: false }
        }
        return { regime: 'word', justParked: false, recallable: false }
    }
    // Parked: sticky (one-way hysteresis). Recall is a manual click, so we only
    // report whether the word is back in the fold — never auto-return.
    const recallable = wordCenterY >= fold.top && wordCenterY <= fold.bottom
    return { regime, justParked: false, recallable }
}
