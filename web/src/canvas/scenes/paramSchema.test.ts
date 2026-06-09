import { describe, test, expect, expectTypeOf } from 'vitest'
import {
    defineSceneParams,
    defineTuning,
    defaultsOf,
    fieldsOf,
    type ParamsOf,
    type ValuesOf,
} from './paramSchema'

describe('paramSchema — defaultsOf', () => {
    test('extracts a single number default', () => {
        const schema = defineSceneParams({
            count: { kind: 'number', default: 42, min: 1, max: 100, step: 1, label: 'Count' },
        })
        expect(defaultsOf(schema)).toEqual({ count: 42 })
    })

    test('extracts mixed number/range/color defaults', () => {
        const schema = defineSceneParams({
            count: { kind: 'number', default: 5, min: 1, max: 10, step: 1, label: 'C' },
            speed: { kind: 'range', default: 0.5, min: 0, max: 1, step: 0.1, label: 'S' },
            tint:  { kind: 'color', default: '#abcdef', label: 'T' },
        })
        expect(defaultsOf(schema)).toEqual({ count: 5, speed: 0.5, tint: '#abcdef' })
    })
})

describe('paramSchema — fieldsOf', () => {
    test('returns descriptors with key injected', () => {
        const schema = defineSceneParams({
            count: { kind: 'number', default: 5, min: 1, max: 10, step: 1, label: 'C' },
        })
        expect(fieldsOf(schema)).toEqual([
            { key: 'count', kind: 'number', default: 5, min: 1, max: 10, step: 1, label: 'C' },
        ])
    })

    test('preserves declaration order across many fields', () => {
        const schema = defineSceneParams({
            zeta:  { kind: 'number', default: 1, min: 0, max: 2, step: 1, label: 'Z' },
            alpha: { kind: 'color',  default: '#000000', label: 'A' },
            mu:    { kind: 'range',  default: 0.5, min: 0, max: 1, step: 0.1, label: 'M' },
        })
        expect(fieldsOf(schema).map((f) => f.key)).toEqual(['zeta', 'alpha', 'mu'])
    })

    test('carries through remount flag', () => {
        const schema = defineSceneParams({
            n: { kind: 'number', default: 1, min: 0, max: 10, step: 1, label: 'N', remount: true },
            x: { kind: 'range',  default: 0, min: 0, max: 1, step: 0.1, label: 'X' },
        })
        const f = fieldsOf(schema)
        expect(f.find((d) => d.key === 'n')?.remount).toBe(true)
        expect(f.find((d) => d.key === 'x')?.remount).toBeUndefined()
    })
})

describe('tuningSchema — enum/boolean defaults', () => {
    test('extracts boolean and enum defaults', () => {
        const schema = defineTuning({
            showSag: { kind: 'boolean', default: true, label: 'Show sag' },
            gravity: {
                kind: 'enum',
                default: 'down',
                options: ['down', 'up', 'left', 'right'],
                label: 'Gravity',
            },
        })
        expect(defaultsOf(schema)).toEqual({ showSag: true, gravity: 'down' })
    })
})

describe('tuningSchema — enum/boolean fieldsOf', () => {
    test('returns descriptors with key injected, options intact', () => {
        const schema = defineTuning({
            showSag: { kind: 'boolean', default: false, label: 'Show sag' },
            edge: { kind: 'enum', default: 'top', options: ['top', 'bottom'], label: 'Edge' },
        })
        expect(fieldsOf(schema)).toEqual([
            { key: 'showSag', kind: 'boolean', default: false, label: 'Show sag' },
            { key: 'edge', kind: 'enum', default: 'top', options: ['top', 'bottom'], label: 'Edge' },
        ])
    })
})

describe('tuningSchema — ValuesOf type inference', () => {
    test('boolean yields boolean, enum yields union of option literals', () => {
        const schema = defineTuning({
            showSag: { kind: 'boolean', default: true, label: 'S' },
            gravity: { kind: 'enum', default: 'down', options: ['down', 'up'], label: 'G' },
        })
        type V = ValuesOf<typeof schema>
        expectTypeOf<V>().toEqualTypeOf<{ showSag: boolean; gravity: 'down' | 'up' }>()
    })
})

describe('tuningSchema — group', () => {
    test('defaultsOf recurses into group fields', () => {
        const schema = defineTuning({
            gravityY: { kind: 'range', default: 0.7, min: 0, max: 2, step: 0.05, label: 'Gravity' },
            chrome: {
                kind: 'group',
                label: 'Card chrome',
                fields: {
                    borderW: { kind: 'range', default: 4, min: 0, max: 8, step: 0.5, label: 'Border' },
                    accent: { kind: 'color', default: '#ff6600', label: 'Accent' },
                },
            },
        })
        expect(defaultsOf(schema)).toEqual({
            gravityY: 0.7,
            chrome: { borderW: 4, accent: '#ff6600' },
        })
    })

    test('fieldsOf keeps the group descriptor shallow with its fields intact', () => {
        const fields = {
            on: { kind: 'boolean', default: true, label: 'On' },
        } as const
        const schema = defineTuning({
            grp: { kind: 'group', label: 'Grp', fields },
        })
        expect(fieldsOf(schema)).toEqual([{ key: 'grp', kind: 'group', label: 'Grp', fields }])
    })

    test('ValuesOf yields a nested object for group fields', () => {
        const schema = defineTuning({
            gravity: { kind: 'enum', default: 'down', options: ['down', 'up'], label: 'G' },
            chrome: {
                kind: 'group',
                label: 'Chrome',
                fields: {
                    borderW: { kind: 'number', default: 4, min: 0, max: 8, step: 1, label: 'B' },
                    accent: { kind: 'color', default: '#ff6600', label: 'A' },
                },
            },
        })
        type V = ValuesOf<typeof schema>
        expectTypeOf<V>().toEqualTypeOf<{
            gravity: 'down' | 'up'
            chrome: { borderW: number; accent: string }
        }>()
    })
})

describe('paramSchema — ParamsOf type inference', () => {
    test('number/range yield number, color yields string', () => {
        const schema = defineSceneParams({
            count: { kind: 'number', default: 5, min: 1, max: 10, step: 1, label: 'C' },
            speed: { kind: 'range', default: 0.5, min: 0, max: 1, step: 0.1, label: 'S' },
            tint:  { kind: 'color', default: '#abcdef', label: 'T' },
        })
        type P = ParamsOf<typeof schema>
        expectTypeOf<P>().toEqualTypeOf<{ count: number; speed: number; tint: string }>()
    })
})
