import type { EdgeTransitions } from './dispatch'

/**
 * Edge table for coupled transitions between specific (from → to) route pairs.
 *
 * Currently set to route every literal pair among the canvas routes
 * (/, /lifelog, /stuff, /blog) through anchor-slide so the primitive can be
 * exercised by clicking through the nav. /blog is included even though it
 * isn't in pageDefs.ts (BlogIndex builds its PageDef dynamically); the edge
 * table keys on path strings, not registry membership. Sign is omitted
 * intentionally — it falls back to the history-direction default
 * (forward = +1, back = -1), so back-button nav reverses the slide axis.
 * Once we settle on which pairs should use which primitive, this list
 * should be pruned.
 *
 * Dynamic routes (e.g. /blog/:slug, /stuff/flash/:slug) are not enumerated
 * here — they go through the fallback decoupled T1+T2 path.
 */
export const edges: EdgeTransitions = {
    '/→/lifelog': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/→/stuff': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/→/blog': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/lifelog→/': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/lifelog→/stuff': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/lifelog→/blog': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/stuff→/': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/stuff→/lifelog': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/stuff→/blog': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/blog→/': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/blog→/lifelog': { primitive: 'anchor-slide', axis: 'horizontal' },
    '/blog→/stuff': { primitive: 'anchor-slide', axis: 'horizontal' },
}
