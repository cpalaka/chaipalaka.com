import { describe, test, expect } from 'vitest'
import { defaultsOf, fieldsOf } from '../../canvas/scenes/paramSchema'
import { layoutTuning } from '../../layout/layoutTuning'
import { generateLayoutTuningSource } from '../vite-plugin-atelier'
import { CHAIN_AXIS, CHAIN_SCHEMA, chainPayload } from './chain'

describe('chain schema', () => {
    test('schema fields are exactly the layoutTuning keys — flat, no bindings map', () => {
        expect(fieldsOf(CHAIN_SCHEMA).map((f) => f.key).sort()).toEqual(
            Object.keys(layoutTuning).sort(),
        )
    })

    test('schema defaults are the live layoutTuning values, never copied literals', () => {
        expect(chainPayload(defaultsOf(CHAIN_SCHEMA))).toEqual({
            ...layoutTuning,
        })
    })

    test('chainGap floor honours the spacing guardrail (≥ 60)', () => {
        const gap = fieldsOf(CHAIN_SCHEMA).find((f) => f.key === 'chainGap')
        if (gap?.kind !== 'range') throw new Error('expected a range field')
        expect(gap.min).toBe(60)
    })

    test('payload from working values satisfies the write-back generator', () => {
        const result = generateLayoutTuningSource(
            chainPayload(defaultsOf(CHAIN_SCHEMA)),
        )
        expect(result.ok).toBe(true)
    })

    test('axis key matches the working-set shape from the spec', () => {
        expect(CHAIN_AXIS).toBe('chain')
    })
})
