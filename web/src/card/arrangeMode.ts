/**
 * Arrange-mode seam — the Atelier Layout tab's toggle that flips card
 * pointer semantics: normal drag = physics fling; arrange drag = move the
 * card's anchor. CardImpl reads the flag at pointer-event time (read-at-use)
 * and, while arranging, reports pointer positions here instead of driving
 * the body; the Atelier layout binding turns reports into anchor edits.
 *
 * Lives in production code (not atelier/) so prod never imports atelier
 * modules — the prod-bundle guard's import direction. In prod the flag just
 * sits false and the report channel has no subscribers.
 */

import { createSubscribable } from '../state/subscribable'
import type { Subscribable } from '../state/subscribable'

export interface ArrangeDragReport {
    id: string
    x: number
    y: number
    /** 'down' selects the card; 'move' drags its anchor. */
    type: 'down' | 'move'
}

const arrangeMode = createSubscribable(false)
const dragListeners = new Set<(report: ArrangeDragReport) => void>()

export function getArrangeMode(): Subscribable<boolean> {
    return arrangeMode
}

export function setArrangeMode(active: boolean): void {
    arrangeMode.set(active)
}

export function reportArrangeDrag(report: ArrangeDragReport): void {
    for (const listener of dragListeners) listener(report)
}

export function subscribeArrangeDrag(
    listener: (report: ArrangeDragReport) => void,
): () => void {
    dragListeners.add(listener)
    return () => {
        dragListeners.delete(listener)
    }
}
