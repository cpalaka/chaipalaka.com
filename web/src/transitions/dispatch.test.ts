import { describe, test, expect } from 'vitest'
import { dispatch } from './dispatch'
import type { PageDef } from '../physics/PageDef'
import type { EdgeTransitions } from './dispatch'

const homeDef: PageDef = { gravity: 'down', cards: [] }
const blogDef: PageDef = { gravity: 'down', cards: [] }

describe('dispatch', () => {
    test('edge-table match wins over PageDef transitions', () => {
        const pageDefs: Record<string, PageDef> = {
            '/a': { ...homeDef, transitions: { exit: 'string-cut-drop' } },
            '/b': { ...blogDef, transitions: { enter: 'pour-in-drop' } },
        }
        const edges: EdgeTransitions = {
            '/a→/b': { primitive: 'anchor-slide', axis: 'horizontal' },
        }

        const plan = dispatch('/a', '/b', pageDefs, edges, 'forward')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.primitive).toBe('anchor-slide')
            expect(plan.config.axis).toBe('horizontal')
        }
    })

    test('PageDef decoupled pair wins over history-direction default', () => {
        const pageDefs: Record<string, PageDef> = {
            '/a': { ...homeDef, transitions: { exit: 'cross-fade' } },
            '/b': blogDef,
        }

        const plan = dispatch('/a', '/b', pageDefs, {}, 'forward')

        expect(plan.kind).toBe('decoupled')
        if (plan.kind === 'decoupled') {
            expect(plan.exit).toBe('cross-fade')
            expect(plan.enter).toBe('pour-in-drop') // falls back to default enter
            expect(plan.overlapMs).toBe(200)
        }
    })

    test('forward with no overrides → string-cut-drop + pour-in-drop decoupled', () => {
        const pageDefs: Record<string, PageDef> = {
            '/a': homeDef,
            '/b': blogDef,
        }

        const plan = dispatch('/a', '/b', pageDefs, {}, 'forward')

        expect(plan).toEqual({
            kind: 'decoupled',
            exit: 'string-cut-drop',
            enter: 'pour-in-drop',
            overlapMs: 200,
        })
    })

    test('back with no overrides → same T1+T2 decoupled pair', () => {
        const pageDefs: Record<string, PageDef> = {
            '/a': homeDef,
            '/b': blogDef,
        }

        const plan = dispatch('/a', '/b', pageDefs, {}, 'back')

        expect(plan.kind).toBe('decoupled')
        if (plan.kind === 'decoupled') {
            expect(plan.exit).toBe('string-cut-drop')
            expect(plan.enter).toBe('pour-in-drop')
        }
    })

    test('sibling with no overrides → anchor-slide horizontal coupled, sign=+1', () => {
        const pageDefs: Record<string, PageDef> = {
            '/a': homeDef,
            '/b': blogDef,
        }

        const plan = dispatch('/a', '/b', pageDefs, {}, 'sibling')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.primitive).toBe('anchor-slide')
            expect(plan.config.axis).toBe('horizontal')
            expect(plan.config.sign).toBe(1)
            expect(plan.config.durationMs).toBe(700)
        }
    })

    test('sibling with destination siblingOrder=left flips sign to -1', () => {
        const pageDefs: Record<string, PageDef> = {
            '/a': homeDef,
            '/b': { ...blogDef, siblingOrder: 'left' },
        }

        const plan = dispatch('/a', '/b', pageDefs, {}, 'sibling')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.sign).toBe(-1)
        }
    })

    test('edge with omitted sign uses direction (back → -1)', () => {
        const pageDefs: Record<string, PageDef> = { '/a': homeDef, '/b': blogDef }
        const edges: EdgeTransitions = {
            '/a→/b': { primitive: 'anchor-slide', axis: 'horizontal' },
        }

        const plan = dispatch('/a', '/b', pageDefs, edges, 'back')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.sign).toBe(-1)
        }
    })

    test('edge with explicit sign overrides direction', () => {
        const pageDefs: Record<string, PageDef> = { '/a': homeDef, '/b': blogDef }
        const edges: EdgeTransitions = {
            '/a→/b': { primitive: 'anchor-slide', axis: 'horizontal', sign: 1 },
        }

        const plan = dispatch('/a', '/b', pageDefs, edges, 'back')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.sign).toBe(1)
        }
    })
})
