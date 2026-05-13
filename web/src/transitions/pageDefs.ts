import { pageDef as homePageDef } from '../routes/Home'
import { pageDef as lifelogPageDef } from '../routes/Lifelog'
import { pageDef as stuffPageDef } from '../routes/Stuff'
import { pageDef as notFoundPageDef } from '../routes/NotFound'
import type { PageDef } from '../physics/PageDef'

/**
 * Registry of route paths → PageDef. Used by TransitionDirector to identify
 * which cards are exiting/entering when navigation occurs.
 *
 * Dynamic routes (e.g. `/blog/:slug`, `/stuff/flash/:slug`) are not registered
 * in this slice — transitions to/from those paths degrade to no-op. Slice 21b
 * will introduce a pattern-matching variant for dynamic routes.
 */
export const pageDefs: Record<string, PageDef> = {
    '/': homePageDef,
    '/lifelog': lifelogPageDef,
    '/stuff': stuffPageDef,
}

export const notFoundFallbackPageDef = notFoundPageDef
