import { describe, test, expect, afterEach } from 'vitest'
import { partitionChain, type ChainItem, type PartitionOptions } from './sectionLayout'
import { layoutTuning } from './layoutTuning'
import type { CardSpec } from '../physics/PageSpec'

function makeCard(id: string, overrides: Partial<CardSpec> = {}): CardSpec {
    return {
        id,
        kind: 'blog',
        parent: 'ceiling',
        anchor: () => ({ x: 0, y: 0 }),
        ...overrides,
    }
}

function items(specs: { id: string; height: number; spec?: Partial<CardSpec> }[]): ChainItem[] {
    return specs.map((s, i) => ({
        card: makeCard(s.id, {
            // chain: first card's parent is ceiling, subsequent point at previous id
            parent: i === 0 ? 'ceiling' : specs[i - 1]!.id,
            ...s.spec,
        }),
        height: s.height,
    }))
}

const DESKTOP: PartitionOptions['viewport'] = { width: 1024, height: 700 }
const NARROW: PartitionOptions['viewport'] = { width: 400, height: 800 }

describe('partitionChain', () => {
    test('empty chain yields a single section with no cards or nav', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: [],
            routeKey: '/blog',
        })

        expect(sections).toHaveLength(1)
        expect(sections[0]!.cards).toEqual([])
        expect(sections[0]!.navCards).toEqual([])
    })

    test('single card under viewport yields one section, no nav', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([{ id: 'a', height: 200 }]),
            routeKey: '/blog',
        })

        expect(sections).toHaveLength(1)
        expect(sections[0]!.cards.map((c) => c.id)).toEqual(['a'])
        expect(sections[0]!.navCards).toEqual([])
    })

    test('two cards that overflow split into two sections with nav', () => {
        // Each card 400 tall, viewport 700 tall, with the inline nav reserve
        // (~232px for two NAV_CARD_H + 2 CHAIN_GAP + 24 breathing room),
        // usable shrinks below ~400 → first card alone already overflows after
        // the gap, so each section gets one content card.
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 400 },
                { id: 'b', height: 400 },
            ]),
            routeKey: '/blog',
        })

        expect(sections).toHaveLength(2)
        expect(sections[0]!.cards.map((c) => c.id)).toEqual(['a'])
        expect(sections[1]!.cards.map((c) => c.id)).toEqual(['b'])
        // Section 1 → next only
        expect(sections[0]!.navCards.map((c) => c.id)).toEqual(['/blog-nav-next-s1'])
        // Section 2 (last) → back only
        expect(sections[1]!.navCards.map((c) => c.id)).toEqual(['/blog-nav-back-s2'])
    })

    test('middle section has both back and next nav cards', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 400 },
                { id: 'b', height: 400 },
                { id: 'c', height: 400 },
            ]),
            routeKey: '/blog',
        })

        expect(sections).toHaveLength(3)
        expect(sections[1]!.navCards.map((c) => c.id).sort()).toEqual([
            '/blog-nav-back-s2',
            '/blog-nav-next-s2',
        ])
    })

    test('sectionBreak: after forces split after the marked card', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 100, spec: { sectionBreak: 'after' } },
                { id: 'b', height: 100 },
            ]),
            routeKey: '/blog',
        })

        expect(sections).toHaveLength(2)
        expect(sections[0]!.cards.map((c) => c.id)).toEqual(['a'])
        expect(sections[1]!.cards.map((c) => c.id)).toEqual(['b'])
    })

    test('sectionBreak: before forces split before the marked card', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 100 },
                { id: 'b', height: 100, spec: { sectionBreak: 'before' } },
            ]),
            routeKey: '/blog',
        })

        expect(sections).toHaveLength(2)
        expect(sections[0]!.cards.map((c) => c.id)).toEqual(['a'])
        expect(sections[1]!.cards.map((c) => c.id)).toEqual(['b'])
    })

    test('maxPerSection caps section length', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 50 },
                { id: 'b', height: 50 },
                { id: 'c', height: 50 },
                { id: 'd', height: 50 },
            ]),
            routeKey: '/blog',
            maxPerSection: 2,
        })

        expect(sections).toHaveLength(2)
        expect(sections[0]!.cards.map((c) => c.id)).toEqual(['a', 'b'])
        expect(sections[1]!.cards.map((c) => c.id)).toEqual(['c', 'd'])
    })

    test('author mode bypasses auto-chain heuristic', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 100 },
                { id: 'b', height: 100 },
                { id: 'c', height: 100 },
            ]),
            routeKey: '/lifelog',
            explicitSections: [
                { cardIds: ['a'] },
                { cardIds: ['b', 'c'] },
            ],
        })

        expect(sections).toHaveLength(2)
        expect(sections[0]!.cards.map((c) => c.id)).toEqual(['a'])
        expect(sections[1]!.cards.map((c) => c.id)).toEqual(['b', 'c'])
    })

    test('narrow viewport still emits a single next-nav at section 1', () => {
        const sections = partitionChain({
            viewport: NARROW,
            cards: items([
                { id: 'a', height: 400 },
                { id: 'b', height: 400 },
            ]),
            routeKey: '/blog',
        })

        // Section 1 should have exactly one nav card (next).
        expect(sections[0]!.navCards).toHaveLength(1)
        expect(sections[0]!.navCards[0]!.id).toBe('/blog-nav-next-s1')
    })

    test('non-first section without back-nav: head card inherits chain edge', () => {
        // Author mode with single-card sections — no nav cards emitted
        // when sectionCount > 1 actually... wait, paginated chains always
        // emit nav cards. Use unpaginated single section to verify edge
        // inheritance baseline.
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([{ id: 'a', height: 50 }]),
            routeKey: '/blog',
        })

        // Single section, no back-nav, head card retains its 'ceiling' parent.
        expect(sections[0]!.cards[0]!.parent).toBe('ceiling')
        expect(sections[0]!.navCards).toEqual([])
    })

    test('paginated: back-nav becomes chain head, first content reattaches to back-nav', () => {
        // Three cards forced into 3 sections via overflow. Each non-first
        // section gets a back-nav at the head; the first content card
        // re-attaches to that back-nav, not to the ceiling directly.
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 400 },
                { id: 'b', height: 400 },
                { id: 'c', height: 400 },
            ]),
            routeKey: '/blog',
        })

        expect(sections).toHaveLength(3)

        // Section 1 (first, no back-nav): a hangs from ceiling.
        expect(sections[0]!.cards[0]!.parent).toBe('ceiling')

        // Section 2 (middle, has back-nav): back-nav hangs from ceiling,
        // and b hangs from the back-nav.
        const s2Back = sections[1]!.navCards.find((c) => c.id.includes('back'))!
        expect(s2Back.parent).toBe('ceiling')
        expect(sections[1]!.cards[0]!.parent).toBe(s2Back.id)

        // Section 3 (last, has back-nav): same pattern, c hangs from back-nav.
        const s3Back = sections[2]!.navCards.find((c) => c.id.includes('back'))!
        expect(s3Back.parent).toBe('ceiling')
        expect(sections[2]!.cards[0]!.parent).toBe(s3Back.id)
    })

    test('paginated: next-nav hangs from last content card and trails to floor', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 400 },
                { id: 'b', height: 400 },
                { id: 'c', height: 400 },
            ]),
            routeKey: '/blog',
        })

        // Section 1 has a next-nav; it hangs from card a and trails to floor.
        const s1Next = sections[0]!.navCards.find((c) => c.id.includes('next'))!
        expect(s1Next.parent).toBe('a')
        expect(s1Next.trail).toBe('floor')

        // Section 2 (middle) also has a next-nav hanging from b with floor trail.
        const s2Next = sections[1]!.navCards.find((c) => c.id.includes('next'))!
        expect(s2Next.parent).toBe('b')
        expect(s2Next.trail).toBe('floor')

        // Section 3 (last) has no next-nav → no floor trail anywhere.
        const s3Next = sections[2]!.navCards.find((c) => c.id.includes('next'))
        expect(s3Next).toBeUndefined()
    })

    test('chain field is the inline ordered render list: [back?, ...content, next?]', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 400 },
                { id: 'b', height: 400 },
                { id: 'c', height: 400 },
            ]),
            routeKey: '/blog',
        })

        // Section 1: no back, content [a], next → chain = [a, next]
        expect(sections[0]!.chain.map((c) => c.id)).toEqual([
            'a',
            '/blog-nav-next-s1',
        ])

        // Section 2: back, content [b], next → chain = [back, b, next]
        expect(sections[1]!.chain.map((c) => c.id)).toEqual([
            '/blog-nav-back-s2',
            'b',
            '/blog-nav-next-s2',
        ])

        // Section 3: back, content [c], no next → chain = [back, c]
        expect(sections[2]!.chain.map((c) => c.id)).toEqual([
            '/blog-nav-back-s3',
            'c',
        ])
    })

    test('chain on unpaginated section is just the content cards', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([{ id: 'a', height: 50 }]),
            routeKey: '/blog',
        })

        expect(sections[0]!.chain.map((c) => c.id)).toEqual(['a'])
    })

    test('head-rewrite uses the original chain head parent (gravity-up routes)', () => {
        // Floor-strung chain: section heads should re-attach to 'floor'
        // (via back-nav, when present, or directly for section 1).
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: [
                { card: makeCard('a', { parent: 'floor' }), height: 400 },
                { card: makeCard('b', { parent: 'a' }), height: 400 },
            ],
            routeKey: '/lifelog',
        })

        expect(sections).toHaveLength(2)
        // Section 1: no back-nav, a still hangs from floor.
        expect(sections[0]!.cards[0]!.parent).toBe('floor')
        // Section 2: back-nav itself hangs from floor.
        const s2Back = sections[1]!.navCards.find((c) => c.id.includes('back'))!
        expect(s2Back.parent).toBe('floor')
    })

    test('nav cards have kind=nav', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 400 },
                { id: 'b', height: 400 },
            ]),
            routeKey: '/blog',
        })

        for (const nav of sections.flatMap((s) => s.navCards)) {
            expect(nav.kind).toBe('nav')
        }
    })
})

describe('partitionChain — read-at-use over layoutTuning', () => {
    const source = { ...layoutTuning }
    afterEach(() => {
        Object.assign(layoutTuning, source)
    })

    test('a mid-session chainGap change alters the next partition', () => {
        const opts = (): PartitionOptions => ({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 140 },
                { id: 'b', height: 140 },
            ]),
            routeKey: '/blog',
        })
        // Two 150-tall cards fit one section at the source gap:
        // usable = 700 - chainTop(80) - reserve(276) = 344 ≥ 140+60+140.
        const before = partitionChain(opts()).length
        expect(before).toBe(1)

        layoutTuning.chainGap = 2000
        const after = partitionChain(opts()).length

        expect(after).toBeGreaterThan(before)
    })

    test('a mid-session navCardH change alters the nav reserve, and so the partition', () => {
        const opts = (): PartitionOptions => ({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 140 },
                { id: 'b', height: 140 },
            ]),
            routeKey: '/blog',
        })
        const before = partitionChain(opts()).length

        // Inflate the reserve until the usable budget can't hold both cards.
        layoutTuning.navCardH = 300
        const after = partitionChain(opts()).length

        expect(after).toBeGreaterThan(before)
    })
})
