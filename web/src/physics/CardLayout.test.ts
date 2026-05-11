import { describe, test, expect } from 'vitest'
import { cardLayout, type LayoutInput, type MeasureFn } from './CardLayout'

const fixedMeasure: MeasureFn = (_text, _fontKey, maxWidth) => ({
    width: Math.min(200, maxWidth),
    height: 60,
})

const SPEC_A: LayoutInput = { id: 'a', text: 'Card A', fontKey: 'body' }
const SPEC_B: LayoutInput = { id: 'b', text: 'Card B', fontKey: 'body' }
const SPEC_C: LayoutInput = { id: 'c', text: 'Card C', fontKey: 'body' }
const SPEC_D: LayoutInput = { id: 'd', text: 'Card D', fontKey: 'body' }

describe('cardLayout — basic', () => {
    test('returns one anchor per spec with matching id', () => {
        const anchors = cardLayout(
            [SPEC_A, SPEC_B],
            { width: 1200, height: 800 },
            fixedMeasure,
        )
        expect(anchors).toHaveLength(2)
        expect(anchors[0]!.id).toBe('a')
        expect(anchors[1]!.id).toBe('b')
    })

    test('returns width, height, and maxWidth on each anchor', () => {
        const [anchor] = cardLayout(
            [SPEC_A],
            { width: 1200, height: 800 },
            fixedMeasure,
        )
        expect(anchor!.width).toBeGreaterThan(0)
        expect(anchor!.height).toBeGreaterThan(0)
        expect(anchor!.maxWidth).toBeGreaterThan(0)
    })
})

describe('cardLayout — breakpoints', () => {
    test('desktop (≥1024px) uses 3 columns: first 3 cards have distinct x values', () => {
        const anchors = cardLayout(
            [SPEC_A, SPEC_B, SPEC_C],
            { width: 1200, height: 800 },
            fixedMeasure,
        )
        const xs = anchors.map((a) => a.x)
        expect(new Set(xs).size).toBe(3)
    })

    test('tablet (480–1023px) uses 2 columns: first 2 cards have distinct x, 3rd shares with 1st', () => {
        const anchors = cardLayout(
            [SPEC_A, SPEC_B, SPEC_C],
            { width: 768, height: 1024 },
            fixedMeasure,
        )
        expect(anchors[0]!.x).not.toBe(anchors[1]!.x)
        expect(anchors[2]!.x).toBe(anchors[0]!.x)
    })

    test('mobile (<480px) uses 1 column: all cards share the same x', () => {
        const anchors = cardLayout(
            [SPEC_A, SPEC_B, SPEC_C],
            { width: 375, height: 812 },
            fixedMeasure,
        )
        const xs = anchors.map((a) => a.x)
        expect(new Set(xs).size).toBe(1)
    })

    test('single-column layout stacks cards top-to-bottom', () => {
        const anchors = cardLayout(
            [SPEC_A, SPEC_B, SPEC_C],
            { width: 375, height: 812 },
            fixedMeasure,
        )
        expect(anchors[0]!.y).toBeLessThan(anchors[1]!.y)
        expect(anchors[1]!.y).toBeLessThan(anchors[2]!.y)
    })
})

describe('cardLayout — pre-computed dims', () => {
    test('uses spec.width/height when provided, skipping measure', () => {
        const spy: MeasureFn = () => {
            throw new Error('should not measure')
        }
        const spec: LayoutInput = {
            id: 'x',
            text: 'X',
            fontKey: 'body',
            width: 300,
            height: 150,
        }
        const [anchor] = cardLayout([spec], { width: 1200, height: 800 }, spy)
        expect(anchor!.width).toBe(300)
        expect(anchor!.height).toBe(150)
    })

    test('falls back to measure when dims are absent', () => {
        let called = false
        const spy: MeasureFn = (_t, _f, mw) => {
            called = true
            return { width: Math.min(200, mw), height: 60 }
        }
        const spec: LayoutInput = { id: 'x', text: 'X', fontKey: 'body' }
        cardLayout([spec], { width: 1200, height: 800 }, spy)
        expect(called).toBe(true)
    })
})

describe('cardLayout — stability', () => {
    test('positions are identical across two calls with the same inputs', () => {
        const specs = [SPEC_A, SPEC_B, SPEC_C]
        const viewport = { width: 1200, height: 800 }
        const first = cardLayout(specs, viewport, fixedMeasure)
        const second = cardLayout(specs, viewport, fixedMeasure)
        expect(first).toEqual(second)
    })
})

describe('cardLayout — non-overlap', () => {
    test('no two anchors overlap at rest (bounding boxes are disjoint)', () => {
        const anchors = cardLayout(
            [SPEC_A, SPEC_B, SPEC_C, SPEC_D],
            { width: 1200, height: 800 },
            fixedMeasure,
        )
        for (let i = 0; i < anchors.length; i++) {
            for (let j = i + 1; j < anchors.length; j++) {
                const a = anchors[i]!
                const b = anchors[j]!
                const xOverlap = Math.abs(a.x - b.x) < (a.width + b.width) / 2
                const yOverlap = Math.abs(a.y - b.y) < (a.height + b.height) / 2
                expect(xOverlap && yOverlap).toBe(false)
            }
        }
    })

    test('no two anchors overlap at rest on a mobile viewport', () => {
        const anchors = cardLayout(
            [SPEC_A, SPEC_B, SPEC_C, SPEC_D],
            { width: 375, height: 812 },
            fixedMeasure,
        )
        for (let i = 0; i < anchors.length; i++) {
            for (let j = i + 1; j < anchors.length; j++) {
                const a = anchors[i]!
                const b = anchors[j]!
                const xOverlap = Math.abs(a.x - b.x) < (a.width + b.width) / 2
                const yOverlap = Math.abs(a.y - b.y) < (a.height + b.height) / 2
                expect(xOverlap && yOverlap).toBe(false)
            }
        }
    })
})
