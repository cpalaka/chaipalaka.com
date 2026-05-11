import { describe, test, expect } from 'vitest'
import { buildChain, CHAIN_GAP, CHAIN_X_FRACTION, CHAIN_TOP } from './BlogIndex'
import { measureBlogCard, CARD_PADDING } from './BlogIndex.measure'
import type { Post } from '../../blog/types'

const GUTTER = 16
const fixedMeasure = (_text: string, _fontKey: string, _mw: number) => ({
    width: 200,
    height: 80,
})

const fakePost = (slug: string): Post => ({
    slug,
    frontmatter: {
        title: `Post ${slug}`,
        description: 'A post.',
        date: '2026-01-01',
        tags: [],
        draft: false,
    },
    toc: [],
    Component: () => null,
})

const posts: Post[] = [fakePost('alpha'), fakePost('beta'), fakePost('gamma')]
const viewport = { width: 1200, height: 800 }

describe('BlogIndex chain topology', () => {
    const { pageDef } = buildChain(posts, viewport, fixedMeasure)
    const cards = pageDef.cards

    test('produces one card per post', () => {
        expect(cards).toHaveLength(posts.length)
    })

    test('first card hangs from ceiling', () => {
        expect(cards[0]!.parent).toBe('ceiling')
    })

    test('each subsequent card hangs from the previous slug', () => {
        for (let i = 1; i < cards.length; i++) {
            expect(cards[i]!.parent).toBe(`blog-${posts[i - 1]!.slug}`)
        }
    })

    test('card ids match blog-<slug> format', () => {
        for (let i = 0; i < cards.length; i++) {
            expect(cards[i]!.id).toBe(`blog-${posts[i]!.slug}`)
        }
    })

    test('anchor y values increase strictly top-to-bottom', () => {
        const ys = cards.map((c) => c.anchor(viewport).y)
        for (let i = 1; i < ys.length; i++) {
            expect(ys[i]!).toBeGreaterThan(ys[i - 1]!)
        }
    })

    test('all anchors share the same x fraction of viewport width', () => {
        const xs = cards.map((c) => c.anchor(viewport).x)
        const expected = viewport.width * CHAIN_X_FRACTION
        for (const x of xs) {
            expect(x).toBe(expected)
        }
    })

    test('anchor x tracks viewport width on resize', () => {
        const wider = { width: 1600, height: 900 }
        const xs = cards.map((c) => c.anchor(wider).x)
        const expected = wider.width * CHAIN_X_FRACTION
        for (const x of xs) {
            expect(x).toBe(expected)
        }
    })

    test('y positions respect CHAIN_TOP + measured height / 2 for first card', () => {
        const textMaxWidth = Math.max(1, viewport.width * 0.6 - GUTTER * 2 - CARD_PADDING * 2)
        const { height } = measureBlogCard(posts[0]!.frontmatter, textMaxWidth, fixedMeasure)
        const firstY = cards[0]!.anchor(viewport).y
        expect(firstY).toBe(CHAIN_TOP + height / 2)
    })

    test('y gap between consecutive cards equals height + CHAIN_GAP', () => {
        const textMaxWidth = Math.max(1, viewport.width * 0.6 - GUTTER * 2 - CARD_PADDING * 2)
        const { height } = measureBlogCard(posts[0]!.frontmatter, textMaxWidth, fixedMeasure)
        const ys = cards.map((c) => c.anchor(viewport).y)
        for (let i = 1; i < ys.length; i++) {
            expect(ys[i]! - ys[i - 1]!).toBe(height + CHAIN_GAP)
        }
    })
})
