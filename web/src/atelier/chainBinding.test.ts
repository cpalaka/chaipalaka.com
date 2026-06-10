import { describe, test, expect, vi } from 'vitest'
import { defaultsOf } from '../canvas/scenes/paramSchema'
import { layoutTuning } from '../layout/layoutTuning'
import type { LayoutTuning } from '../layout/layoutTuning'
import { createAtelierStore } from './atelierStore'
import { createChainBinding } from './chainBinding'
import { CHAIN_AXIS, CHAIN_SCHEMA } from './schemas/chain'

function setup(storage = new Map<string, string>()) {
    const store = createAtelierStore({ storage })
    const tuning: LayoutTuning = { ...layoutTuning }
    const notify = vi.fn()
    const binding = createChainBinding({ store, tuning, notify })
    return { store, tuning, notify, binding }
}

describe('chain binding', () => {
    test('registers the axis with the tuning object as Baseline', () => {
        const { store } = setup()
        expect(store.get().baselines[CHAIN_AXIS]).toEqual(
            defaultsOf(CHAIN_SCHEMA),
        )
        expect(store.dirtyPaths(CHAIN_AXIS)).toEqual([])
    })

    test('a store edit mutates the tuning object and notifies — chain routes re-partition', () => {
        const { store, tuning, notify } = setup()
        notify.mockClear()
        store.setValues(CHAIN_AXIS, {
            ...store.get().axes[CHAIN_AXIS]!,
            chainGap: 90,
        })
        expect(tuning.chainGap).toBe(90)
        expect(notify).toHaveBeenCalled()
        expect(store.dirtyPaths(CHAIN_AXIS)).toEqual(['chainGap'])
    })

    test('writeBackReconcile adopts working values as Baseline, clearing dirty', () => {
        const { store, binding } = setup()
        store.setValues(CHAIN_AXIS, {
            ...store.get().axes[CHAIN_AXIS]!,
            chainGap: 90,
        })
        binding.writeBackReconcile()
        expect(store.dirtyPaths(CHAIN_AXIS)).toEqual([])
    })

    test('dispose restores the Baseline onto the tuning object, notifies, and stops reacting', () => {
        const { store, tuning, notify, binding } = setup()
        store.setValues(CHAIN_AXIS, {
            ...store.get().axes[CHAIN_AXIS]!,
            chainGap: 90,
        })
        notify.mockClear()
        binding.dispose()
        expect(tuning.chainGap).toBe(layoutTuning.chainGap)
        expect(notify).toHaveBeenCalled()
        notify.mockClear()
        store.setValues(CHAIN_AXIS, {
            ...store.get().axes[CHAIN_AXIS]!,
            chainGap: 120,
        })
        expect(tuning.chainGap).toBe(layoutTuning.chainGap)
        expect(notify).not.toHaveBeenCalled()
    })

    test('working values persisted from a previous session re-apply on creation', () => {
        const storage = new Map<string, string>()
        const first = setup(storage)
        first.store.setValues(CHAIN_AXIS, {
            ...first.store.get().axes[CHAIN_AXIS]!,
            chainGap: 90,
        })
        first.binding.dispose()

        const second = setup(storage)
        expect(second.store.dirtyPaths(CHAIN_AXIS)).toEqual(['chainGap'])
        expect(second.tuning.chainGap).toBe(90)
    })
})
