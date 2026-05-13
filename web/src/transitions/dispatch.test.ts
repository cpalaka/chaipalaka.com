import { describe, test, expect } from 'vitest'
import { dispatch } from './dispatch'
import type { PageDef } from '../physics/PageDef'
import type { EdgeTransitions, PageDefResolver } from './dispatch'

const homeDef: PageDef = { gravity: 'down', cards: [] }
const blogDef: PageDef = { gravity: 'down', cards: [] }

function resolverOf(map: Record<string, PageDef>): PageDefResolver {
    return (path: string) => map[path]
}

describe('dispatch', () => {
    test('edge-table match wins over PageDef transitions', () => {
        const resolve = resolverOf({
            '/a': { ...homeDef, transitions: { exit: 'string-cut-drop' } },
            '/b': { ...blogDef, transitions: { enter: 'pour-in-drop' } },
        })
        const edges: EdgeTransitions = {
            '/a→/b': { primitive: 'anchor-slide', axis: 'horizontal' },
        }

        const plan = dispatch('/a', '/b', resolve, edges, 'forward')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.primitive).toBe('anchor-slide')
            expect(plan.config.axis).toBe('horizontal')
        }
    })

    test('PageDef decoupled pair wins over history-direction default', () => {
        const resolve = resolverOf({
            '/a': { ...homeDef, transitions: { exit: 'cross-fade' } },
            '/b': blogDef,
        })

        const plan = dispatch('/a', '/b', resolve, {}, 'forward')

        expect(plan.kind).toBe('decoupled')
        if (plan.kind === 'decoupled') {
            expect(plan.exit).toBe('cross-fade')
            expect(plan.enter).toBe('pour-in-drop')
            expect(plan.overlapMs).toBe(200)
        }
    })

    test('forward with no overrides → string-cut-drop + pour-in-drop decoupled', () => {
        const resolve = resolverOf({ '/a': homeDef, '/b': blogDef })

        const plan = dispatch('/a', '/b', resolve, {}, 'forward')

        expect(plan).toEqual({
            kind: 'decoupled',
            exit: 'string-cut-drop',
            enter: 'pour-in-drop',
            overlapMs: 200,
        })
    })

    test('back with no overrides → same T1+T2 decoupled pair', () => {
        const resolve = resolverOf({ '/a': homeDef, '/b': blogDef })

        const plan = dispatch('/a', '/b', resolve, {}, 'back')

        expect(plan.kind).toBe('decoupled')
        if (plan.kind === 'decoupled') {
            expect(plan.exit).toBe('string-cut-drop')
            expect(plan.enter).toBe('pour-in-drop')
        }
    })

    test('sibling with no overrides → anchor-slide horizontal coupled, sign=+1', () => {
        const resolve = resolverOf({ '/a': homeDef, '/b': blogDef })

        const plan = dispatch('/a', '/b', resolve, {}, 'sibling')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.primitive).toBe('anchor-slide')
            expect(plan.config.axis).toBe('horizontal')
            expect(plan.config.sign).toBe(1)
            expect(plan.config.durationMs).toBe(700)
        }
    })

    test('sibling with destination siblingOrder=left flips sign to -1', () => {
        const resolve = resolverOf({
            '/a': homeDef,
            '/b': { ...blogDef, siblingOrder: 'left' },
        })

        const plan = dispatch('/a', '/b', resolve, {}, 'sibling')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.sign).toBe(-1)
        }
    })

    test('edge with omitted sign uses direction (back → -1)', () => {
        const resolve = resolverOf({ '/a': homeDef, '/b': blogDef })
        const edges: EdgeTransitions = {
            '/a→/b': { primitive: 'anchor-slide', axis: 'horizontal' },
        }

        const plan = dispatch('/a', '/b', resolve, edges, 'back')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.sign).toBe(-1)
        }
    })

    test('edge with explicit sign overrides direction', () => {
        const resolve = resolverOf({ '/a': homeDef, '/b': blogDef })
        const edges: EdgeTransitions = {
            '/a→/b': { primitive: 'anchor-slide', axis: 'horizontal', sign: 1 },
        }

        const plan = dispatch('/a', '/b', resolve, edges, 'back')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.sign).toBe(1)
        }
    })

    test('hash-section: same path with sections → coupled anchor-slide vertical w/ ceiling sensor', () => {
        const resolve = resolverOf({
            '/blog': { ...blogDef, sections: { mode: 'auto-chain' } },
        })

        const plan = dispatch('/blog', '/blog#s2', resolve, {}, 'forward')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.primitive).toBe('anchor-slide')
            expect(plan.config.axis).toBe('vertical')
            expect(plan.config.sign).toBe(1)
            expect(plan.config.sensorEdges).toBe('ceiling')
        }
    })

    test('hash-section: back direction yields sign=-1 and floor sensor', () => {
        const resolve = resolverOf({
            '/blog': { ...blogDef, sections: { mode: 'auto-chain' } },
        })

        const plan = dispatch('/blog#s3', '/blog#s2', resolve, {}, 'back')

        expect(plan.kind).toBe('coupled')
        if (plan.kind === 'coupled') {
            expect(plan.config.axis).toBe('vertical')
            expect(plan.config.sign).toBe(-1)
            expect(plan.config.sensorEdges).toBe('floor')
        }
    })

    test('hash-section: pageDef without sections falls through to default', () => {
        const resolve = resolverOf({ '/blog': blogDef })

        // Same pathname, but no sections declared → not a section transition.
        // Falls through to history-direction default.
        const plan = dispatch('/blog', '/blog#s2', resolve, {}, 'forward')

        // With no sections, same-path transitions are unusual; the safest
        // fallback is the default decoupled T1+T2 (or whatever the regular
        // dispatch would produce). Just assert it's NOT a vertical anchor-slide
        // — the section branch did not fire.
        if (plan.kind === 'coupled') {
            expect(plan.config.axis).not.toBe('vertical')
        }
    })

    test('hash-section: different pathnames bypass the section branch', () => {
        const resolve = resolverOf({
            '/blog': { ...blogDef, sections: { mode: 'auto-chain' } },
            '/a': homeDef,
        })

        const plan = dispatch('/a', '/blog#s2', resolve, {}, 'forward')

        // Cross-route nav, even with a hash on the target, should not invoke
        // the section branch.
        expect(plan.kind).toBe('decoupled')
    })

    test('resolver is consulted by path (not a pre-built map snapshot)', () => {
        // Simulates runtime registration: the resolver returns a PageDef that
        // wasn't known at director-construction time.
        const runtime = new Map<string, PageDef>()
        const resolve: PageDefResolver = (p) => runtime.get(p)

        runtime.set('/blog/abc', {
            ...blogDef,
            transitions: { enter: 'cross-fade' },
        })

        const plan = dispatch('/a', '/blog/abc', resolve, {}, 'forward')

        expect(plan.kind).toBe('decoupled')
        if (plan.kind === 'decoupled') {
            expect(plan.enter).toBe('cross-fade')
        }
    })
})
