import { describe, test, expect } from 'vitest'
import {
    buildChain,
    layoutSection,
    CHAIN_GAP,
    CHAIN_X_FRACTION,
    CHAIN_TOP,
} from './BlogIndex'
import { NAV_CARD_H, NAV_TOP_INSET } from '../../layout/sectionLayout'
import type { CardSpec } from '../../physics/PageDef'
import { measureBlogCard, CARD_PADDING } from './BlogIndex.measure'
import type { Font } from '../../text/fonts'
import type { Post } from '../../blog/types'

const GUTTER = 16
const fixedMeasure = (_text: string, _font: Font, _mw: number) => ({
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

describe('layoutSection', () => {
    // A non-first section's cards still carry the original full-chain
    // anchor closures (which place them where they would sit if the full
    // chain were rendered). layoutSection must rewrite their y so the
    // section's chain starts at CHAIN_TOP again — otherwise section 2's
    // head card hangs from the ceiling with a tether that runs the full
    // height of the would-be earlier chain.
    function makeCard(id: string, capturedY: number): CardSpec {
        return {
            id,
            kind: 'blog',
            parent: 'ceiling',
            anchor: (vp) => ({ x: vp.width * CHAIN_X_FRACTION, y: capturedY }),
        }
    }

    test('first card in section anchors at CHAIN_TOP + height/2', () => {
        const card = makeCard('blog-x', 999) // would-be full-chain y, irrelevant
        const out = layoutSection([card], { 'blog-x': 80 }, viewport)
        expect(out).toHaveLength(1)
        expect(out[0]!.anchor(viewport).y).toBe(CHAIN_TOP + 80 / 2)
    })

    test('subsequent cards stack with height + CHAIN_GAP from the previous', () => {
        const cards = [
            makeCard('blog-a', 999),
            makeCard('blog-b', 1500),
        ]
        const heights = { 'blog-a': 100, 'blog-b': 120 }
        const out = layoutSection(cards, heights, viewport)
        const yA = out[0]!.anchor(viewport).y
        const yB = out[1]!.anchor(viewport).y
        expect(yA).toBe(CHAIN_TOP + 100 / 2)
        // top of B = top of A + 100 + CHAIN_GAP → centre yB = yA + 100/2 + CHAIN_GAP + 120/2
        expect(yB).toBe(yA + 100 / 2 + CHAIN_GAP + 120 / 2)
    })

    test('x position still tracks viewport width', () => {
        const card = makeCard('blog-x', 999)
        const wide = { width: 1600, height: 900 }
        const out = layoutSection([card], { 'blog-x': 80 }, viewport)
        expect(out[0]!.anchor(wide).x).toBe(wide.width * CHAIN_X_FRACTION)
    })

    test('preserves card identity fields (id, kind, parent)', () => {
        const card = makeCard('blog-x', 999)
        const out = layoutSection([card], { 'blog-x': 80 }, viewport)
        expect(out[0]!.id).toBe('blog-x')
        expect(out[0]!.kind).toBe('blog')
        expect(out[0]!.parent).toBe('ceiling')
    })

    test('back-nav is pinned at NAV_TOP_INSET below ceiling (fixed)', () => {
        const back: CardSpec = {
            id: 'nav-back',
            kind: 'nav',
            parent: 'ceiling',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const content: CardSpec = {
            id: 'blog-x',
            kind: 'blog',
            parent: 'nav-back',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const out = layoutSection([back, content], { 'blog-x': 100 }, viewport)
        const yBack = out[0]!.anchor(viewport).y
        // Back-nav top edge = NAV_TOP_INSET = 40 → centre = 40 + NAV_CARD_H/2
        expect(yBack).toBe(NAV_TOP_INSET + NAV_CARD_H / 2)
    })

    test('next-nav stacks just below last content card with CHAIN_GAP', () => {
        const content: CardSpec = {
            id: 'blog-x',
            kind: 'blog',
            parent: 'ceiling',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const next: CardSpec = {
            id: 'nav-next',
            kind: 'nav',
            parent: 'blog-x',
            anchor: () => ({ x: 0, y: 0 }),
            trail: 'floor',
        }
        const out = layoutSection([content, next], { 'blog-x': 100 }, viewport)
        const yContent = out[0]!.anchor(viewport).y
        const yNext = out[1]!.anchor(viewport).y
        // Next-nav top = content bottom + CHAIN_GAP → centre = yContent + h/2 + CHAIN_GAP + NAV_CARD_H/2
        expect(yNext).toBe(yContent + 100 / 2 + CHAIN_GAP + NAV_CARD_H / 2)
    })

    test('content card after back-nav starts below it with CHAIN_GAP', () => {
        const back: CardSpec = {
            id: 'nav-back',
            kind: 'nav',
            parent: 'ceiling',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const content: CardSpec = {
            id: 'blog-x',
            kind: 'blog',
            parent: 'nav-back',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const out = layoutSection([back, content], { 'blog-x': 100 }, viewport)
        const yBack = out[0]!.anchor(viewport).y
        const yContent = out[1]!.anchor(viewport).y
        // Content top = back-nav bottom + CHAIN_GAP
        expect(yContent).toBe(yBack + NAV_CARD_H / 2 + CHAIN_GAP + 100 / 2)
    })

    test('without back-nav, content starts at CHAIN_TOP (unchanged)', () => {
        const content: CardSpec = {
            id: 'blog-x',
            kind: 'blog',
            parent: 'ceiling',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const out = layoutSection([content], { 'blog-x': 100 }, viewport)
        expect(out[0]!.anchor(viewport).y).toBe(CHAIN_TOP + 100 / 2)
    })

    test('back-nav respects top inset (e.g. top-edge frame bar)', () => {
        const back: CardSpec = {
            id: 'nav-back',
            kind: 'nav',
            parent: 'ceiling',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const content: CardSpec = {
            id: 'blog-x',
            kind: 'blog',
            parent: 'nav-back',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const insets = { top: 40, bottom: 0 }
        const out = layoutSection(
            [back, content],
            { 'blog-x': 100 },
            viewport,
            insets,
        )
        const yBack = out[0]!.anchor(viewport).y
        // Ceiling y = 40 → back-nav centre = ceiling + inset + h/2
        expect(yBack).toBe(insets.top + NAV_TOP_INSET + NAV_CARD_H / 2)
    })

    test('next-nav follows content height (chain-stacked, not fixed)', () => {
        // Next-nav floats with the chain. Tall content pushes next-nav
        // lower; the trail string to floor grows or shrinks accordingly.
        const back: CardSpec = {
            id: 'nav-back',
            kind: 'nav',
            parent: 'ceiling',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const content: CardSpec = {
            id: 'blog-x',
            kind: 'blog',
            parent: 'nav-back',
            anchor: () => ({ x: 0, y: 0 }),
        }
        const next: CardSpec = {
            id: 'nav-next',
            kind: 'nav',
            parent: 'blog-x',
            anchor: () => ({ x: 0, y: 0 }),
            trail: 'floor',
        }
        const outSmall = layoutSection([back, content, next], { 'blog-x': 80 }, viewport)
        const outTall = layoutSection([back, content, next], { 'blog-x': 300 }, viewport)
        const yNextSmall = outSmall[2]!.anchor(viewport).y
        const yNextTall = outTall[2]!.anchor(viewport).y
        // Tall content pushes next-nav down by 220px (300 - 80).
        expect(yNextTall - yNextSmall).toBe(220)
    })
})
