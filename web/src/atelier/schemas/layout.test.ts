import { describe, test, expect } from 'vitest'
import { defaultsOf, fieldsOf } from '../../canvas/scenes/paramSchema'
import { lifelogLayout } from '../../routes/Lifelog.layout'
import { stuffLayout } from '../../routes/Stuff.layout'
import { generateLayoutSource } from '../vite-plugin-atelier'
import type { RouteLayout } from '../../routes/routeLayout'
import {
    LAYOUT_ROUTES,
    descendantsOf,
    layoutAxis,
    layoutSchemaFor,
    layoutFromValues,
    valuesFromLayout,
    routeForPathname,
} from './layout'

const sample: RouteLayout = {
    gravity: 'down',
    cards: [
        { id: 'one', kind: 'note', parent: 'ceiling', anchor: { fx: 0.2, fy: 0.3 } },
        { id: 'two', kind: 'nav', parent: 'one', anchor: { fx: 0.6, fy: 0.7 } },
        { id: 'three', kind: 'blog', parent: null, anchor: { fx: 0.5, fy: 0.5 } },
    ],
}

describe('layout schema generation', () => {
    test('schema has a gravity enum plus one group per card', () => {
        const schema = layoutSchemaFor(sample)
        const fields = fieldsOf(schema)
        expect(fields.map((f) => f.key)).toEqual(['gravity', 'one', 'two', 'three'])
        const gravity = fields[0]!
        if (gravity.kind !== 'enum') throw new Error('expected gravity enum')
        expect(gravity.options).toEqual(['down', 'up', 'left', 'right'])
    })

    test('parent enum offers ceiling/floor/detached and every sibling except self', () => {
        const schema = layoutSchemaFor(sample)
        const group = fieldsOf(schema).find((f) => f.key === 'two')
        if (group?.kind !== 'group') throw new Error('expected a card group')
        const parent = fieldsOf(group.fields).find((f) => f.key === 'parent')
        if (parent?.kind !== 'enum') throw new Error('expected parent enum')
        expect(parent.options).toEqual([
            'ceiling',
            'floor',
            'detached',
            'one',
            'three',
        ])
        expect(parent.default).toBe('one')
    })

    test('schema defaults round-trip back to the source layout', () => {
        const schema = layoutSchemaFor(sample)
        expect(layoutFromValues(defaultsOf(schema), sample)).toEqual(sample)
        expect(valuesFromLayout(sample)).toEqual(defaultsOf(schema))
    })

    test('detached parent maps to null in the layout and back', () => {
        const schema = layoutSchemaFor(sample)
        const values = defaultsOf(schema) as Record<string, Record<string, unknown>>
        expect(values['three']!['parent']).toBe('detached')
        const layout = layoutFromValues(values, sample)
        expect(layout.cards[2]!.parent).toBeNull()
    })

    test('working values for the real routes satisfy the write-back generator', () => {
        for (const [route, def] of Object.entries(LAYOUT_ROUTES)) {
            const values = valuesFromLayout(def.layout)
            const result = generateLayoutSource(route, layoutFromValues(values, def.layout))
            expect(result.ok, `route ${route}`).toBe(true)
        }
    })
})

describe('descendantsOf — the mini-inspector cycle guard', () => {
    test('walks the parent chain transitively from working values', () => {
        const schema = layoutSchemaFor(sample)
        let values = defaultsOf(schema) as Record<string, unknown>
        // three → parent two; chain: one ← two ← three
        values = {
            ...values,
            three: { ...(values['three'] as object), parent: 'two' },
        }
        expect(descendantsOf(values, sample, 'one')).toEqual(
            new Set(['two', 'three']),
        )
        expect(descendantsOf(values, sample, 'two')).toEqual(new Set(['three']))
        expect(descendantsOf(values, sample, 'three')).toEqual(new Set())
    })
})

describe('layout route registry', () => {
    test('registers the data-layout routes with their layouts and axis keys', () => {
        expect(LAYOUT_ROUTES['lifelog']!.layout).toBe(lifelogLayout)
        expect(LAYOUT_ROUTES['stuff']!.layout).toBe(stuffLayout)
        expect(layoutAxis('lifelog')).toBe('layout.lifelog')
    })

    test('pathname lookup matches data-layout routes exactly — chain routes get null', () => {
        expect(routeForPathname('/lifelog')).toBe('lifelog')
        expect(routeForPathname('/lifelog/')).toBe('lifelog')
        expect(routeForPathname('/stuff')).toBe('stuff')
        expect(routeForPathname('/stuff/flash')).toBeNull()
        expect(routeForPathname('/blog')).toBeNull()
        expect(routeForPathname('/')).toBeNull()
    })
})
