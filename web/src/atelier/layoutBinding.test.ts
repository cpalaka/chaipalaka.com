import { describe, test, expect, vi } from 'vitest'
import { createAtelierStore } from './atelierStore'
import type { AxisValues } from './atelierStore'
import { createLayoutBinding } from './layoutBinding'
import { layoutAxis, valuesFromLayout } from './schemas/layout'
import type { RouteLayout } from '../routes/routeLayout'

const baseline: RouteLayout = {
    gravity: 'down',
    cards: [
        { id: 'one', kind: 'note', parent: 'ceiling', anchor: { fx: 0.2, fy: 0.3 } },
        { id: 'two', kind: 'nav', parent: 'one', anchor: { fx: 0.6, fy: 0.7 } },
    ],
}

const AXIS = layoutAxis('demo')

function setup(storage = new Map<string, string>()) {
    const store = createAtelierStore({ storage })
    const override = { set: vi.fn() }
    const binding = createLayoutBinding({
        store,
        route: 'demo',
        layout: baseline,
        override,
    })
    return { store, override, binding }
}

function withCardField(
    values: AxisValues,
    id: string,
    field: string,
    value: unknown,
): AxisValues {
    const card = values[id] as AxisValues
    return { ...values, [id]: { ...card, [field]: value } }
}

describe('layout binding', () => {
    test('registers the axis with the source layout as Baseline and pushes it live', () => {
        const { store, override } = setup()
        expect(store.get().baselines[AXIS]).toEqual(valuesFromLayout(baseline))
        expect(store.dirtyPaths(AXIS)).toEqual([])
        expect(override.set).toHaveBeenLastCalledWith(baseline)
    })

    test('a store edit pushes the converted working layout to the override', () => {
        const { store, override } = setup()
        store.setValues(
            AXIS,
            withCardField(store.get().axes[AXIS]!, 'one', 'fx', 0.9),
        )
        expect(override.set).toHaveBeenLastCalledWith({
            ...baseline,
            cards: [
                { ...baseline.cards[0]!, anchor: { fx: 0.9, fy: 0.3 } },
                baseline.cards[1]!,
            ],
        })
        expect(store.dirtyPaths(AXIS)).toEqual(['one.fx'])
    })

    test('a detached re-parent reaches the override as parent: null', () => {
        const { store, override } = setup()
        store.setValues(
            AXIS,
            withCardField(store.get().axes[AXIS]!, 'two', 'parent', 'detached'),
        )
        const pushed = override.set.mock.lastCall![0] as RouteLayout
        expect(pushed.cards[1]!.parent).toBeNull()
    })

    test('writeBackReconcile adopts working values as Baseline, clearing dirty', () => {
        const { store, binding } = setup()
        store.setValues(
            AXIS,
            withCardField(store.get().axes[AXIS]!, 'one', 'fx', 0.9),
        )
        binding.writeBackReconcile()
        expect(store.dirtyPaths(AXIS)).toEqual([])
    })

    test('dispose clears the override and stops reacting', () => {
        const { store, override, binding } = setup()
        binding.dispose()
        expect(override.set).toHaveBeenLastCalledWith(null)
        override.set.mockClear()
        store.setValues(
            AXIS,
            withCardField(store.get().axes[AXIS]!, 'one', 'fx', 0.9),
        )
        expect(override.set).not.toHaveBeenCalled()
    })

    test('working values persisted from a previous session re-apply on creation', () => {
        const storage = new Map<string, string>()
        const first = setup(storage)
        first.store.setValues(
            AXIS,
            withCardField(first.store.get().axes[AXIS]!, 'one', 'fx', 0.9),
        )
        first.binding.dispose()

        const second = setup(storage)
        expect(second.store.dirtyPaths(AXIS)).toEqual(['one.fx'])
        const pushed = second.override.set.mock.lastCall![0] as RouteLayout
        expect(pushed.cards[0]!.anchor).toEqual({ fx: 0.9, fy: 0.3 })
    })
})
