import type { EdgeTransitions } from './dispatch'

/**
 * Edge table for coupled transitions between specific (from → to) route pairs.
 * Empty in slice 21 — all transitions fall through to history-direction defaults
 * (forward/back → T1+T2, sibling → T3).
 */
export const edges: EdgeTransitions = {}
