/**
 * Ambient-teacher seeding (spec §7/§12): a **populated** route loads with a card
 * or two already pinned and gently swinging, so the *keep* rung is taught by
 * example. This is the pure core — given the route's resting state, a declarative
 * list of ambient pins, and a DOM resolver (selector → element + rect), it
 * computes the `PinSpec`s to hand to `PinStore.pin`. DOM-free so it is unit
 * tested without a browser; the imperative seeding (rAF, getBoundingClientRect,
 * unpin-on-unmount) lives in `useAmbientPins`.
 */

import type { PinKind, PinSpec } from './PinStore'
import type { Resting } from '../physics/PageSpec'

export interface AmbientPinSpec {
    /** CSS selector for the source word/link, resolved within the content box. */
    selector: string
    kind: PinKind
    /** Portal: target title + transcluded lead + href. */
    title?: string
    lead?: string
    href?: string
    /** Pocket: the lifted note html (trusted authored content). */
    bodyHtml?: string
    /** Card size; defaults below. */
    width?: number
    height?: number
    /** Card-centre offset from the word's bottom-centre, px. Default: hang below. */
    offset?: { x: number; y: number }
}

export interface WordRect {
    left: number
    top: number
    width: number
    height: number
}

export interface Resolved {
    el: Element
    rect: WordRect
}

const DEFAULT_WIDTH = 240
const DEFAULT_HEIGHT = 130
// Hang the card below its word by default, so the rope reads downward (the card
// route picks gravity; the offset only sets the initial drop point).
const DEFAULT_OFFSET = { x: 0, y: 150 }

/**
 * Build the `PinSpec`s to seed for a route. Quiet (or absent) resting seeds
 * nothing; populated seeds one pin per spec whose source word resolves.
 */
export function buildAmbientPinSpecs(
    resting: Resting | undefined,
    specs: readonly AmbientPinSpec[],
    resolve: (selector: string) => Resolved | null,
): PinSpec[] {
    if (resting !== 'populated') return []
    const out: PinSpec[] = []
    for (const s of specs) {
        const r = resolve(s.selector)
        if (!r) continue
        const width = s.width ?? DEFAULT_WIDTH
        const height = s.height ?? DEFAULT_HEIGHT
        const off = s.offset ?? DEFAULT_OFFSET
        const wordCx = r.rect.left + r.rect.width / 2
        const wordBottom = r.rect.top + r.rect.height
        out.push({
            sourceEl: r.el,
            kind: s.kind,
            center: { x: wordCx + off.x, y: wordBottom + off.y },
            width,
            height,
            title: s.title,
            lead: s.lead,
            href: s.href,
            bodyHtml: s.bodyHtml,
        })
    }
    return out
}
