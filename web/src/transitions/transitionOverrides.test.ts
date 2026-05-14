import { describe, test, expect } from 'vitest'
import { edges } from './transitionOverrides'
import { dispatch, type PageDefResolver } from './dispatch'
import type { PageDef } from '../routes/PageDef'

const CANVAS_ROUTES = ['/', '/lifelog', '/stuff', '/blog'] as const

// Minimal PageDef stub matching what canvas-route PageDefs declare today:
// no siblingOrder, no transitions. If a future route declares either, dispatch
// will short-circuit before the sibling-order branch and these assertions will
// (correctly) need updating.
const stubPageDef: PageDef = { gravity: 'down', cards: [] }

function resolverForCanvasRoutes(): PageDefResolver {
    return (path: string) =>
        CANVAS_ROUTES.includes(path as (typeof CANVAS_ROUTES)[number]) ? stubPageDef : undefined
}

describe('transitions/transitionOverrides — contract', () => {
    test('the overrides record starts empty (no production tuning yet)', () => {
        expect(Object.keys(edges)).toHaveLength(0)
    })
})

describe('transitions/transitionOverrides — sibling-order fallback covers the 12 canvas pairs', () => {
    // With the table empty, every sibling-route transition between the four
    // canvas routes must produce an equivalent plan from dispatch's
    // sibling-order branch — proving the noise entries were redundant.
    const resolve = resolverForCanvasRoutes()

    for (const from of CANVAS_ROUTES) {
        for (const to of CANVAS_ROUTES) {
            if (from === to) continue
            test(`${from} → ${to}: coupled horizontal anchor-slide, sign=+1, 700ms`, () => {
                const plan = dispatch(from, to, resolve, edges, 'sibling')

                expect(plan.kind).toBe('coupled')
                if (plan.kind === 'coupled') {
                    expect(plan.config.primitive).toBe('anchor-slide')
                    expect(plan.config.axis).toBe('horizontal')
                    expect(plan.config.sign).toBe(1)
                    expect(plan.config.durationMs).toBe(700)
                }
            })
        }
    }
})
