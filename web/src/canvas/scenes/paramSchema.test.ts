import { describe, test, expect, expectTypeOf } from 'vitest'
import { defineSceneParams, defaultsOf, fieldsOf, type ParamsOf } from './paramSchema'

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
