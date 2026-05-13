import type {
    AuthorSectionDef,
    CardSpec,
    PageDef,
} from '../physics/PageDef'
import type { Vec2, Viewport } from '../physics/PhysicsWorld'

export const NAV_CARD_W = 180
export const NAV_CARD_H = 56
export const NAV_BREAKPOINT = 600
export const NAV_BOTTOM_INSET = 80
export const NAV_TETHER_LEN = 24
export const CHAIN_TOP = 80
export const CHAIN_GAP = 60

const NAV_RESERVE = NAV_CARD_H + NAV_BOTTOM_INSET + 24 // small breathing room

export interface ChainItem {
    card: CardSpec
    height: number
}

export interface SectionLayout {
    sectionIndex: number
    sectionCount: number
    cards: CardSpec[]
    navCards: CardSpec[]
}

export interface PartitionOptions {
    viewport: Viewport
    cards: readonly ChainItem[]
    routeKey: string
    maxPerSection?: number
    explicitSections?: readonly AuthorSectionDef[]
}

/**
 * Returns the y-coordinate (top edge in physics space) where the nav card row
 * sits — bottom-of-viewport minus the inset.
 */
function navRowY(viewport: Viewport): number {
    return viewport.height - NAV_BOTTOM_INSET
}

function makeNavCard(
    routeKey: string,
    target: 'prev' | 'next',
    sectionIndex: number,
    layout: 'narrow' | 'desktop-back' | 'desktop-next',
): CardSpec {
    const targetLabel = target === 'prev' ? 'back' : 'next'
    const id = `${routeKey}-nav-${targetLabel}-s${sectionIndex + 1}`

    const anchor = (vp: Viewport): Vec2 => {
        const y = navRowY(vp)
        if (layout === 'narrow') {
            return { x: vp.width / 2, y }
        }
        if (layout === 'desktop-back') {
            return { x: NAV_CARD_W / 2 + 24, y }
        }
        return { x: vp.width - NAV_CARD_W / 2 - 24, y }
    }

    return { id, kind: 'nav', parent: 'floor', anchor }
}

function navCardsForSection(
    routeKey: string,
    sectionIndex: number,
    sectionCount: number,
    viewport: Viewport,
): CardSpec[] {
    if (sectionCount <= 1) return []

    const showBack = sectionIndex > 0
    const showNext = sectionIndex < sectionCount - 1
    if (!showBack && !showNext) return []

    const narrow = viewport.width < NAV_BREAKPOINT
    const cards: CardSpec[] = []

    if (narrow) {
        // Single nav card centered. If both directions are valid, the partitioner
        // emits the forward control (the dominant action); back is reachable via
        // the browser back button. This matches the spec note "single full-width
        // nav card on narrow viewport".
        const target: 'prev' | 'next' = showNext ? 'next' : 'prev'
        cards.push(makeNavCard(routeKey, target, sectionIndex, 'narrow'))
        return cards
    }

    if (showBack) {
        cards.push(makeNavCard(routeKey, 'prev', sectionIndex, 'desktop-back'))
    }
    if (showNext) {
        cards.push(makeNavCard(routeKey, 'next', sectionIndex, 'desktop-next'))
    }
    return cards
}

function partitionByOverflow(
    items: readonly ChainItem[],
    viewport: Viewport,
    maxPerSection?: number,
): CardSpec[][] {
    const usable = viewport.height - CHAIN_TOP - NAV_RESERVE

    const sections: CardSpec[][] = []
    let current: CardSpec[] = []
    let cursorY = 0

    const flush = () => {
        if (current.length > 0) {
            sections.push(current)
            current = []
            cursorY = 0
        }
    }

    for (const item of items) {
        const sb = item.card.sectionBreak

        if (sb === 'before' && current.length > 0) {
            flush()
        }

        const projected = cursorY + (current.length > 0 ? CHAIN_GAP : 0) + item.height
        const overflows = current.length > 0 && projected > usable
        const overMax = maxPerSection !== undefined && current.length >= maxPerSection

        if (overflows || overMax) {
            flush()
        }

        // Place card in current section
        cursorY += (current.length > 0 ? CHAIN_GAP : 0) + item.height
        current.push(item.card)

        if (sb === 'after') {
            flush()
        }
    }

    flush()
    if (sections.length === 0) sections.push([])
    return sections
}

function partitionByAuthor(
    items: readonly ChainItem[],
    explicit: readonly AuthorSectionDef[],
): CardSpec[][] {
    const byId = new Map(items.map((i) => [i.card.id, i.card]))
    return explicit.map((section) =>
        section.cardIds
            .map((id) => byId.get(id))
            .filter((c): c is CardSpec => c !== undefined),
    )
}

export function partitionChain(opts: PartitionOptions): SectionLayout[] {
    const { viewport, cards, routeKey, maxPerSection, explicitSections } = opts

    const partitioned: CardSpec[][] = explicitSections
        ? partitionByAuthor(cards, explicitSections)
        : partitionByOverflow(cards, viewport, maxPerSection)

    return partitioned.map((sectionCards, sectionIndex) => ({
        sectionIndex,
        sectionCount: partitioned.length,
        cards: sectionCards,
        navCards: navCardsForSection(
            routeKey,
            sectionIndex,
            partitioned.length,
            viewport,
        ),
    }))
}

/**
 * Convenience: produce the layout for a PageDef whose `cards` form a chain.
 * Pulls heights from the supplied `heights` map (route is responsible for
 * measuring its own card content; we don't re-implement measurement here).
 */
export function partitionPageDef(
    pageDef: PageDef,
    viewport: Viewport,
    routeKey: string,
    heights: Record<string, number>,
): SectionLayout[] {
    const items: ChainItem[] = pageDef.cards.map((card) => ({
        card,
        height: heights[card.id] ?? 0,
    }))

    const explicit =
        pageDef.sections?.mode === 'author'
            ? pageDef.sections.sections
            : undefined
    const maxPerSection =
        pageDef.sections?.mode === 'auto-chain'
            ? pageDef.sections.maxPerSection
            : undefined

    return partitionChain({
        viewport,
        cards: items,
        routeKey,
        ...(explicit ? { explicitSections: explicit } : {}),
        ...(maxPerSection !== undefined ? { maxPerSection } : {}),
    })
}
