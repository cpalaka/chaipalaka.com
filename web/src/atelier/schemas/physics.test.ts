import { describe, test, expect } from 'vitest'
import { defaultsOf, fieldsOf } from '../../canvas/scenes/paramSchema'
import type { TuningSchema } from '../../canvas/scenes/paramSchema'
import { physicsTuning } from '../../physics/physicsTuning'
import { generatePhysicsTuningSource } from '../vite-plugin-atelier'
import {
    PHYSICS_AXIS,
    PHYSICS_BINDINGS,
    PHYSICS_SCHEMA,
    physicsPayload,
} from './physics'

function leafPaths(schema: TuningSchema, prefix = ''): string[] {
    return fieldsOf(schema).flatMap((field) =>
        field.kind === 'group'
            ? leafPaths(field.fields, `${prefix}${field.key}.`)
            : [`${prefix}${field.key}`],
    )
}

describe('physics schema', () => {
    test('bindings map every schema leaf to a physicsTuning key, both exhaustive', () => {
        expect(Object.keys(PHYSICS_BINDINGS).sort()).toEqual(
            leafPaths(PHYSICS_SCHEMA).sort(),
        )
        expect(Object.values(PHYSICS_BINDINGS).sort()).toEqual(
            Object.keys(physicsTuning).sort(),
        )
    })

    test('schema defaults are the live physicsTuning values, never copied literals', () => {
        const defaults = defaultsOf(PHYSICS_SCHEMA)
        expect(physicsPayload(defaults)).toEqual({ ...physicsTuning })
    })

    test('tetherStiffness is a log-scale slider reaching true near-zero (1e-9)', () => {
        const tether = fieldsOf(PHYSICS_SCHEMA).find((f) => f.key === 'tether')
        if (tether?.kind !== 'group') throw new Error('expected a tether group')
        const stiffness = fieldsOf(tether.fields).find(
            (f) => f.key === 'stiffness',
        )
        if (stiffness?.kind !== 'range') throw new Error('expected a range field')
        expect(stiffness.scale).toBe('log')
        expect(stiffness.min).toBe(1e-9)
    })

    test('payload from working values satisfies the write-back generator', () => {
        const result = generatePhysicsTuningSource(
            physicsPayload(defaultsOf(PHYSICS_SCHEMA)),
        )
        expect(result.ok).toBe(true)
    })

    test('axis key matches the working-set shape from the spec', () => {
        expect(PHYSICS_AXIS).toBe('physics')
    })
})
