import { describe, test, expect } from 'vitest'
import { partitionChain, type ChainItem, type PartitionOptions } from './sectionLayout'
import type { CardSpec } from '../physics/PageDef'

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
        // Each card 400 tall, viewport 700 tall, NAV_RESERVE ~140 → usable ~560.
        // Card 1 at y≈80..480 fits; card 2 would need y≈540..940 → overflow → split.
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

    test('narrow viewport uses a single centered nav card', () => {
        const sections = partitionChain({
            viewport: NARROW,
            cards: items([
                { id: 'a', height: 400 },
                { id: 'b', height: 400 },
            ]),
            routeKey: '/blog',
        })

        // Section 1 should have exactly one nav card (next), centered.
        expect(sections[0]!.navCards).toHaveLength(1)
        const nav = sections[0]!.navCards[0]!
        const anchor = nav.anchor(NARROW)
        expect(anchor.x).toBeCloseTo(NARROW.width / 2, 0)
        expect(nav.id).toBe('/blog-nav-next-s1')
    })

    test('desktop nav cards are bottom-corners', () => {
        const sections = partitionChain({
            viewport: DESKTOP,
            cards: items([
                { id: 'a', height: 400 },
                { id: 'b', height: 400 },
                { id: 'c', height: 400 },
            ]),
            routeKey: '/blog',
        })

        const middleNav = sections[1]!.navCards
        const back = middleNav.find((c) => c.id.includes('back'))!
        const next = middleNav.find((c) => c.id.includes('next'))!
        const backA = back.anchor(DESKTOP)
        const nextA = next.anchor(DESKTOP)

        expect(backA.x).toBeLessThan(DESKTOP.width / 2)
        expect(nextA.x).toBeGreaterThan(DESKTOP.width / 2)
        // Same y (bottom inset)
        expect(backA.y).toBeCloseTo(nextA.y, 0)
        // Near the bottom
        expect(backA.y).toBeGreaterThan(DESKTOP.height / 2)
    })

    test('nav cards are floor-strung with kind=nav', () => {
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
            expect(nav.parent).toBe('floor')
        }
    })
})
