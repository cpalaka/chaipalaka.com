import { describe, test, expect } from 'vitest'
import { pageSpecFromLayout, resolveAnchor, type RouteLayout } from './routeLayout'

const viewport = { width: 1200, height: 800 }

describe('resolveAnchor', () => {
    test('fraction anchor resolves against the viewport', () => {
        const anchor = resolveAnchor({ fx: 0.5, fy: 0.25 })
        expect(anchor(viewport)).toEqual({ x: 600, y: 200 })
        expect(anchor({ width: 800, height: 600 })).toEqual({ x: 400, y: 150 })
    })

    test('closure anchor passes through untouched', () => {
        const computed = (vp: { width: number; height: number }) => ({
            x: vp.width - 200,
            y: 80,
        })
        expect(resolveAnchor(computed)).toBe(computed)
    })
})

describe('pageSpecFromLayout', () => {
    const layout: RouteLayout = {
        gravity: 'down',
        cards: [
            { id: 'a', kind: 'lifelog', parent: 'ceiling', anchor: { fx: 0.5, fy: 0.25 } },
            { id: 'b', kind: 'note', parent: 'floor', anchor: () => ({ x: 10, y: 20 }) },
        ],
    }

    test('maps gravity and card fields, resolving anchors', () => {
        const spec = pageSpecFromLayout(layout)
        expect(spec.gravity).toBe('down')
        expect(spec.cards.map((c) => [c.id, c.kind, c.parent])).toEqual([
            ['a', 'lifelog', 'ceiling'],
            ['b', 'note', 'floor'],
        ])
        expect(spec.cards[0]!.anchor(viewport)).toEqual({ x: 600, y: 200 })
        expect(spec.cards[1]!.anchor(viewport)).toEqual({ x: 10, y: 20 })
    })

    test('a gravity-less (drift) layout omits gravity from the PageSpec', () => {
        const drift: RouteLayout = {
            cards: [
                { id: 'a', kind: 'blog', parent: null, anchor: { fx: 0.5, fy: 0.5 } },
            ],
        }
        const spec = pageSpecFromLayout(drift)
        expect('gravity' in spec).toBe(false)
        expect(spec.gravity).toBeUndefined()
        expect(spec.cards).toHaveLength(1)
    })
})
