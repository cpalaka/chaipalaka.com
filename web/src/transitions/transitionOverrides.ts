import type { EdgeTransitions } from './dispatch'

/**
 * Per-pair transition overrides for the dispatch pipeline.
 *
 * Every entry here MUST express behaviour distinct from the sibling-order
 * default, which is:
 *   - primitive: 'anchor-slide'
 *   - axis: 'horizontal'
 *   - sign: derived from `toDef.siblingOrder` (left → -1, otherwise +1)
 *   - durationMs: physicsTuning.anchorSlideDurationMs
 *
 * Equivalent-to-default entries are noise: a future reader cannot tell
 * tuning intent from cargo-culted scaffolding when both look the same.
 *
 * Dynamic routes (e.g. /blog/:slug, /stuff/flash/:slug) are NOT
 * enumerated here — they go through the decoupled T1+T2 fallback in
 * dispatch.ts.
 */
export const edges: EdgeTransitions = {}
