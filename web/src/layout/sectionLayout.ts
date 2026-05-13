import type {
    AuthorSectionDef,
    CardSpec,
    ParentRef,
    PageDef,
} from '../physics/PageDef'
import type { Vec2, Viewport } from '../physics/PhysicsWorld'

export const NAV_CARD_W = 180
export const NAV_CARD_H = 56
export const NAV_BREAKPOINT = 600
export const CHAIN_TOP = 80
export const CHAIN_GAP = 60

// Fixed insets for inline nav cards — back-nav top edge sits NAV_TOP_INSET
// below the ceiling, next-nav bottom edge sits NAV_BOTTOM_INSET above the
// floor. Content fills the middle.
export const NAV_TOP_INSET = 40
export const NAV_BOTTOM_INSET = 40

// Reserve vertical budget for inline nav cards (back + next) plus their
// chain gaps. Slight over-reservation is fine — partitioning never knows
// up front whether a section will end up at the head or tail of the
// chain (no back-nav / no next-nav respectively).
const NAV_RESERVE =
    NAV_TOP_INSET +
    NAV_CARD_H +
    CHAIN_GAP +
    NAV_CARD_H +
    NAV_BOTTOM_INSET +
    24

export interface ChainItem {
    card: CardSpec
    height: number
}

export interface SectionLayout {
    sectionIndex: number
    sectionCount: number
    /** Content cards only — first card's parent rewritten to back-nav id when one exists, else inherits the chain head parent. */
    cards: CardSpec[]
    /** Nav cards for this section (kind: 'nav'), in chain order: back (if any) then next (if any). */
    navCards: CardSpec[]
    /** Full inline chain: optional back-nav, content cards, optional next-nav. Parent/trail topology pre-wired. */
    chain: CardSpec[]
}

export interface PartitionOptions {
    viewport: Viewport
    cards: readonly ChainItem[]
    routeKey: string
    maxPerSection?: number
    explicitSections?: readonly AuthorSectionDef[]
}

function makeNavCard(
    routeKey: string,
    target: 'prev' | 'next',
    sectionIndex: number,
    parent: ParentRef,
    trail?: ParentRef,
): CardSpec {
    const targetLabel = target === 'prev' ? 'back' : 'next'
    const id = `${routeKey}-nav-${targetLabel}-s${sectionIndex + 1}`

    // Anchor is chain-centered. Routes that lay out a section (e.g.
    // BlogIndex's layoutSection) override these anchors to position
    // each card within the section's vertical chain; this default
    // is the fallback for unsynthesised consumers.
    const anchor = (vp: Viewport): Vec2 => ({ x: vp.width / 2, y: 0 })

    return trail !== undefined
        ? { id, kind: 'nav', parent, anchor, trail }
        : { id, kind: 'nav', parent, anchor }
}

/**
 * Builds the inline chain for a section: optional back-nav at the head,
 * the content cards (with parent topology rewired so the head re-attaches
 * correctly), and optional next-nav at the tail.
 *
 * Parent topology:
 *   - back-nav (if present) → chain head parent (e.g. 'ceiling')
 *   - first content card → back-nav id if present, else chain head parent
 *   - subsequent content cards → preserve their original predecessor
 *   - next-nav (if present) → last content card id, with trail: 'floor'
 */
function buildSectionChain(
    routeKey: string,
    sectionIndex: number,
    sectionCount: number,
    contentCards: CardSpec[],
    chainHeadParent: ParentRef,
): { cards: CardSpec[]; navCards: CardSpec[]; chain: CardSpec[] } {
    const paginated = sectionCount > 1
    const showBack = paginated && sectionIndex > 0
    const showNext = paginated && sectionIndex < sectionCount - 1

    const backNav: CardSpec | null = showBack
        ? makeNavCard(routeKey, 'prev', sectionIndex, chainHeadParent)
        : null

    // Content card parent rewiring: head re-attaches to back-nav or chain edge.
    const headParent: ParentRef = backNav ? backNav.id : chainHeadParent
    const rewrittenContent: CardSpec[] = contentCards.map((card, i) =>
        i === 0 ? { ...card, parent: headParent } : card,
    )

    const lastContent = rewrittenContent[rewrittenContent.length - 1]
    const nextNav: CardSpec | null = showNext && lastContent
        ? makeNavCard(
              routeKey,
              'next',
              sectionIndex,
              lastContent.id,
              'floor',
          )
        : null

    const navCards = [
        ...(backNav ? [backNav] : []),
        ...(nextNav ? [nextNav] : []),
    ]
    const chain = [
        ...(backNav ? [backNav] : []),
        ...rewrittenContent,
        ...(nextNav ? [nextNav] : []),
    ]
    return { cards: rewrittenContent, navCards, chain }
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

    // The original chain head's parent declares which edge the chain is
    // strung from (ceiling for gravity:down routes, floor for gravity:up).
    // Section heads inherit this so paginated sections stay anchored to
    // the same edge as the full chain.
    const chainHeadParent: ParentRef = cards[0]?.card.parent ?? 'ceiling'

    return partitioned.map((sectionCards, sectionIndex) => {
        const built = buildSectionChain(
            routeKey,
            sectionIndex,
            partitioned.length,
            sectionCards,
            chainHeadParent,
        )
        return {
            sectionIndex,
            sectionCount: partitioned.length,
            ...built,
        }
    })
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
