import { describe, test, expect } from 'vitest'
import { defaultsOf } from '../canvas/scenes/paramSchema'
import { physicsTuning } from '../physics/physicsTuning'
import type { PhysicsTuning } from '../physics/physicsTuning'
import { createAtelierStore } from './atelierStore'
import type { AxisValues } from './atelierStore'
import { createPhysicsBinding } from './physicsBinding'
import { PHYSICS_AXIS, PHYSICS_SCHEMA } from './schemas/physics'

function setup(storage = new Map<string, string>()) {
    const store = createAtelierStore({ storage })
    const tuning: PhysicsTuning = { ...physicsTuning }
    const binding = createPhysicsBinding({ store, tuning })
    return { store, tuning, binding }
}

function withGravity(values: AxisValues, gravityY: number): AxisValues {
    const world = values['world'] as AxisValues
    return { ...values, world: { ...world, gravityY } }
}

describe('physics binding', () => {
    test('registers the axis with the tuning object as Baseline', () => {
        const { store } = setup()
        expect(store.get().baselines[PHYSICS_AXIS]).toEqual(
            defaultsOf(PHYSICS_SCHEMA),
        )
        expect(store.dirtyPaths(PHYSICS_AXIS)).toEqual([])
    })

    test('a store edit mutates the tuning object — the running world reads it next tick', () => {
        const { store, tuning } = setup()
        store.setValues(
            PHYSICS_AXIS,
            withGravity(store.get().axes[PHYSICS_AXIS]!, 2.5),
        )
        expect(tuning.gravityY).toBe(2.5)
        expect(store.dirtyPaths(PHYSICS_AXIS)).toEqual(['world.gravityY'])
    })

    test('a field reset restores the source value on the tuning object', () => {
        const { store, tuning } = setup()
        store.setValues(
            PHYSICS_AXIS,
            withGravity(store.get().axes[PHYSICS_AXIS]!, 2.5),
        )
        store.resetField(PHYSICS_AXIS, 'world.gravityY')
        expect(tuning.gravityY).toBe(physicsTuning.gravityY)
        expect(store.dirtyPaths(PHYSICS_AXIS)).toEqual([])
    })

    test('writeBackReconcile adopts working values as Baseline, clearing dirty', () => {
        const { store, tuning, binding } = setup()
        store.setValues(
            PHYSICS_AXIS,
            withGravity(store.get().axes[PHYSICS_AXIS]!, 2.5),
        )
        binding.writeBackReconcile()
        expect(store.dirtyPaths(PHYSICS_AXIS)).toEqual([])
        expect(tuning.gravityY).toBe(2.5)
    })

    test('dispose restores the Baseline onto the tuning object and stops reacting', () => {
        const { store, tuning, binding } = setup()
        store.setValues(
            PHYSICS_AXIS,
            withGravity(store.get().axes[PHYSICS_AXIS]!, 2.5),
        )
        binding.dispose()
        expect(tuning.gravityY).toBe(physicsTuning.gravityY)
        store.setValues(
            PHYSICS_AXIS,
            withGravity(store.get().axes[PHYSICS_AXIS]!, 1.1),
        )
        expect(tuning.gravityY).toBe(physicsTuning.gravityY)
    })

    test('working values persisted from a previous session re-apply on creation', () => {
        const storage = new Map<string, string>()
        const first = setup(storage)
        first.store.setValues(
            PHYSICS_AXIS,
            withGravity(first.store.get().axes[PHYSICS_AXIS]!, 2.5),
        )
        first.binding.dispose()

        const second = setup(storage)
        expect(second.store.dirtyPaths(PHYSICS_AXIS)).toEqual(['world.gravityY'])
        expect(second.tuning.gravityY).toBe(2.5)
    })
})
