/**
 * The **pin locator** (task-028): a serializable identity for a pinned card's
 * source word, so a persisted pin can re-resolve its word on reload.
 *
 * A Ladder source is always an `<a>` with an `href` — a Portal (`/blog/…`) or a
 * Pocket footnote ref (`#user-content-fn-N`). The href is the natural key; `nth`
 * disambiguates the rare case of several same-href triggers on one route (it is
 * the index *among same-href triggers*, so it only shifts when a duplicate is
 * added/removed, not on unrelated content edits). Re-resolution that fails — the
 * word genuinely removed underneath — is **stale**, and the caller drops the pin
 * (spec §7; the v2.1 staleness policy).
 *
 * Pure over a `ParentNode` (the content box) so it is unit tested headlessly; the
 * candidate set is the same `LADDER_TRIGGER_SELECTOR` the peek triggers use.
 */

import { LADDER_TRIGGER_SELECTOR } from '../peek/triggerSelector'

export interface PinLocator {
    /** The source word's `href` attribute, as authored (not URL-resolved). */
    href: string
    /** Index of the element among same-href Ladder triggers in the box. */
    nth: number
}

function sameHrefTriggers(href: string, root: ParentNode): Element[] {
    return [...root.querySelectorAll(LADDER_TRIGGER_SELECTOR)].filter(
        (e) => e.getAttribute('href') === href,
    )
}

/** Build a locator for a source element, or null if it is not a locatable trigger. */
export function locate(el: Element, root: ParentNode): PinLocator | null {
    const href = el.getAttribute('href')
    if (!href) return null
    const nth = sameHrefTriggers(href, root).indexOf(el)
    if (nth < 0) return null
    return { href, nth }
}

/** Re-resolve a locator to its element within root, or null if stale. */
export function resolve(locator: PinLocator, root: ParentNode): Element | null {
    return sameHrefTriggers(locator.href, root)[locator.nth] ?? null
}
