import { pageDef as homePageDef } from './Home'
import { pageDef as lifelogPageDef } from './Lifelog'
import { pageDef as stuffPageDef } from './Stuff'
import { pageDef as notFoundPageDef } from './NotFound'
import type { PageDef } from './PageDef'

/**
 * Registry of route paths → PageDef. Used by TransitionDirector to identify
 * which cards are exiting/entering when navigation occurs.
 *
 * Dynamic routes (e.g. `/blog/:slug`, `/stuff/flash/:slug`) are not registered
 * here — they self-register via the runtime PageDefRegistry instead.
 */
export const pageDefs: Record<string, PageDef> = {
    '/': homePageDef,
    '/lifelog': lifelogPageDef,
    '/stuff': stuffPageDef,
}

export const notFoundFallbackPageDef = notFoundPageDef
