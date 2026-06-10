/**
 * Re-drop seam — a counter that keys the CardLayer. Bumping it remounts
 * every CardImpl: registry entries survive (they live in the provider
 * above), but each card's body-creation effect re-runs, so bodies respawn
 * at anchor + spawn offset and replay spawn → fall → pendulum-settle under
 * the current physicsTuning values. Keying the route subtree instead would
 * NOT replay — CardImpl is keyed by entry id, so re-registered entries
 * reuse the mounted component and its body.
 *
 * Lives in production code (not atelier/) so prod never imports atelier
 * modules — the direction the prod-bundle guard enforces. Only the dev-only
 * Atelier panel ever calls bumpRedrop; in prod the counter just sits at 0.
 */

import { createSubscribable } from '../state/subscribable'
import type { Subscribable } from '../state/subscribable'

const redropKey = createSubscribable(0)

export function getRedropKey(): Subscribable<number> {
    return redropKey
}

export function bumpRedrop(): void {
    redropKey.set(redropKey.get() + 1)
}
