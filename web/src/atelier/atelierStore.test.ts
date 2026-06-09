import { describe, test, expect, beforeEach } from 'vitest'

import { defineTuning } from '../canvas/scenes/paramSchema'
import { persistentMap } from '../state/persistentMap'
import { createAtelierStore, ATELIER_STORAGE_KEY } from './atelierStore'

const physicsSchema = defineTuning({
    gravityY: { kind: 'range', default: 0.7, min: 0, max: 3, step: 0.05, label: 'Gravity' },
    buoyancyGain: { kind: 'range', default: 1.5, min: 0, max: 5, step: 0.1, label: 'Buoyancy' },
})

function makeStore(storage: Map<string, string> = new Map()) {
    return createAtelierStore({ storage })
}

beforeEach(() => {
    localStorage.clear()
})

describe('AtelierStore — axis registration and baselines', () => {
    test('reconcileBaseline on a fresh axis adopts the baseline as working values', () => {
        const store = makeStore()
        store.registerAxis('physics', physicsSchema)
        expect(store.get().axes['physics']).toBeUndefined()

        store.reconcileBaseline('physics', { gravityY: 0.7, buoyancyGain: 1.5 })
        expect(store.get().axes['physics']).toEqual({ gravityY: 0.7, buoyancyGain: 1.5 })
        expect(store.get().baselines['physics']).toEqual({ gravityY: 0.7, buoyancyGain: 1.5 })
    })
})

describe('AtelierStore — editing working values', () => {
    test('setValues replaces an axis’s working values and fires subscribers', () => {
        const store = makeStore()
        store.registerAxis('physics', physicsSchema)
        store.reconcileBaseline('physics', { gravityY: 0.7, buoyancyGain: 1.5 })

        const seen: unknown[] = []
        store.subscribe((next) => seen.push(next.axes['physics']))

        store.setValues('physics', { gravityY: 1.2, buoyancyGain: 1.5 })
        expect(store.get().axes['physics']).toEqual({ gravityY: 1.2, buoyancyGain: 1.5 })
        expect(seen).toEqual([{ gravityY: 1.2, buoyancyGain: 1.5 }])
        // baseline is untouched by edits
        expect(store.get().baselines['physics']).toEqual({ gravityY: 0.7, buoyancyGain: 1.5 })
    })

    test('setValues on an unregistered axis throws', () => {
        const store = makeStore()
        expect(() => store.setValues('typo', { x: 1 })).toThrow(/not registered/)
    })
})

const tokensSchema = defineTuning({
    accent: { kind: 'color', default: '#aabbcc', label: 'Accent' },
    card: {
        kind: 'group',
        label: 'Card chrome',
        fields: {
            borderWidth: { kind: 'range', default: 4, min: 0, max: 8, step: 0.5, label: 'Border width' },
            shadow: { kind: 'boolean', default: true, label: 'Soft shadow' },
        },
    },
})

const TOKENS_BASELINE = {
    accent: '#aabbcc',
    card: { borderWidth: 4, shadow: true },
}

describe('AtelierStore — dirty-diffing vs. baseline', () => {
    test('a freshly reconciled axis has no dirty fields', () => {
        const store = makeStore()
        store.registerAxis('tokens.dark', tokensSchema)
        store.reconcileBaseline('tokens.dark', TOKENS_BASELINE)
        expect(store.dirtyPaths('tokens.dark')).toEqual([])
        expect(store.isDirty('tokens.dark', 'accent')).toBe(false)
    })

    test('editing a field marks exactly that leaf path dirty, including group leaves', () => {
        const store = makeStore()
        store.registerAxis('tokens.dark', tokensSchema)
        store.reconcileBaseline('tokens.dark', TOKENS_BASELINE)

        store.setValues('tokens.dark', {
            accent: '#aabbcc',
            card: { borderWidth: 6, shadow: true },
        })
        expect(store.dirtyPaths('tokens.dark')).toEqual(['card.borderWidth'])
        expect(store.isDirty('tokens.dark', 'card.borderWidth')).toBe(true)
        expect(store.isDirty('tokens.dark', 'card.shadow')).toBe(false)
        expect(store.isDirty('tokens.dark', 'accent')).toBe(false)
    })

    test('an axis with no baseline yet reports nothing dirty', () => {
        const store = makeStore()
        store.registerAxis('tokens.light', tokensSchema)
        expect(store.dirtyPaths('tokens.light')).toEqual([])
        expect(store.isDirty('tokens.light', 'accent')).toBe(false)
    })
})

describe('AtelierStore — baseline reconciliation', () => {
    test('clean fields track a refreshed baseline; dirty fields keep their working values', () => {
        const store = makeStore()
        store.registerAxis('tokens.dark', tokensSchema)
        store.reconcileBaseline('tokens.dark', TOKENS_BASELINE)
        // edit only the accent — borderWidth/shadow stay clean
        store.setValues('tokens.dark', { accent: '#112233', card: { borderWidth: 4, shadow: true } })

        // source changed underneath (e.g. hand edit + HMR): borderWidth 4 → 2
        store.reconcileBaseline('tokens.dark', { accent: '#aabbcc', card: { borderWidth: 2, shadow: true } })
        expect(store.get().axes['tokens.dark']).toEqual({
            accent: '#112233', // dirty — kept
            card: { borderWidth: 2, shadow: true }, // clean — tracks the new source
        })
        expect(store.dirtyPaths('tokens.dark')).toEqual(['accent'])
    })

    test('after write-back, reconciling with the written values clears all dirty flags', () => {
        const store = makeStore()
        store.registerAxis('physics', physicsSchema)
        store.reconcileBaseline('physics', { gravityY: 0.7, buoyancyGain: 1.5 })
        store.setValues('physics', { gravityY: 2.0, buoyancyGain: 0.5 })
        expect(store.dirtyPaths('physics')).toEqual(['gravityY', 'buoyancyGain'])

        // write-back regenerated the source from working state; HMR re-imports it
        store.reconcileBaseline('physics', { gravityY: 2.0, buoyancyGain: 0.5 })
        expect(store.dirtyPaths('physics')).toEqual([])
        expect(store.get().axes['physics']).toEqual({ gravityY: 2.0, buoyancyGain: 0.5 })
        expect(store.get().baselines['physics']).toEqual({ gravityY: 2.0, buoyancyGain: 0.5 })
    })
})

describe('AtelierStore — per-field and per-axis reset', () => {
    test('resetField restores the baseline value for that leaf only', () => {
        const store = makeStore()
        store.registerAxis('tokens.dark', tokensSchema)
        store.reconcileBaseline('tokens.dark', TOKENS_BASELINE)
        store.setValues('tokens.dark', {
            accent: '#112233',
            card: { borderWidth: 6, shadow: true },
        })

        store.resetField('tokens.dark', 'card.borderWidth')
        expect(store.get().axes['tokens.dark']).toEqual({
            accent: '#112233',
            card: { borderWidth: 4, shadow: true },
        })
        expect(store.dirtyPaths('tokens.dark')).toEqual(['accent'])
    })

    test('resetAxis restores every baseline value and clears all dirty flags', () => {
        const store = makeStore()
        store.registerAxis('tokens.dark', tokensSchema)
        store.reconcileBaseline('tokens.dark', TOKENS_BASELINE)
        store.setValues('tokens.dark', {
            accent: '#112233',
            card: { borderWidth: 6, shadow: false },
        })

        store.resetAxis('tokens.dark')
        expect(store.get().axes['tokens.dark']).toEqual(TOKENS_BASELINE)
        expect(store.dirtyPaths('tokens.dark')).toEqual([])
    })
})

describe('AtelierStore — working sets', () => {
    function storeWithTwoAxes() {
        const store = makeStore()
        store.registerAxis('physics', physicsSchema)
        store.registerAxis('tokens.dark', tokensSchema)
        store.reconcileBaseline('physics', { gravityY: 0.7, buoyancyGain: 1.5 })
        store.reconcileBaseline('tokens.dark', TOKENS_BASELINE)
        return store
    }

    test('saveSet snapshots every axis and switchSet re-applies the snapshot', () => {
        const store = storeWithTwoAxes()
        store.setValues('physics', { gravityY: 2.0, buoyancyGain: 1.5 })
        store.saveSet('heavy')
        store.setValues('physics', { gravityY: 0.1, buoyancyGain: 3.0 })
        store.setValues('tokens.dark', { accent: '#ff0000', card: { borderWidth: 0, shadow: false } })
        store.saveSet('floaty')

        const seen: unknown[] = []
        store.subscribe((next) => seen.push(next.axes['physics']))

        store.switchSet('heavy')
        expect(store.get().activeSet).toBe('heavy')
        expect(store.get().axes['physics']).toEqual({ gravityY: 2.0, buoyancyGain: 1.5 })
        // axes untouched in 'heavy' still revert to the values saved with it
        expect(store.get().axes['tokens.dark']).toEqual(TOKENS_BASELINE)
        // subscribers fired — this is what live binders hang off
        expect(seen).toEqual([{ gravityY: 2.0, buoyancyGain: 1.5 }])
        // dirty is still measured against the source baseline, not the set
        expect(store.dirtyPaths('physics')).toEqual(['gravityY'])
    })

    test('later edits do not leak into a saved snapshot', () => {
        const store = storeWithTwoAxes()
        store.saveSet('clean')
        store.setValues('physics', { gravityY: 9.9, buoyancyGain: 1.5 })
        store.switchSet('clean')
        expect(store.get().axes['physics']).toEqual({ gravityY: 0.7, buoyancyGain: 1.5 })
    })

    test('saveSet marks the set active; switchSet on an unknown name throws', () => {
        const store = storeWithTwoAxes()
        store.saveSet('a')
        expect(store.get().activeSet).toBe('a')
        expect(() => store.switchSet('nope')).toThrow(/unknown working set/i)
    })
})

describe('AtelierStore — persistence under chaipalaka.atelier', () => {
    test('working values, sets, and active set survive reconstruction (reload)', () => {
        const store = makeStore(persistentMap(ATELIER_STORAGE_KEY))
        store.registerAxis('physics', physicsSchema)
        store.reconcileBaseline('physics', { gravityY: 0.7, buoyancyGain: 1.5 })
        store.setValues('physics', { gravityY: 2.0, buoyancyGain: 1.5 })
        store.saveSet('keeper')
        store.setValues('physics', { gravityY: 0.3, buoyancyGain: 2.5 })

        // a reload constructs a fresh store over a fresh persistentMap
        const reborn = makeStore(persistentMap(ATELIER_STORAGE_KEY))
        reborn.registerAxis('physics', physicsSchema)
        expect(reborn.get().axes['physics']).toEqual({ gravityY: 0.3, buoyancyGain: 2.5 })
        expect(reborn.get().sets['keeper']).toEqual({
            physics: { gravityY: 2.0, buoyancyGain: 1.5 },
        })
        expect(reborn.get().activeSet).toBe('keeper')
        // baselines are never persisted — they re-derive from source each load
        expect(reborn.get().baselines['physics']).toBeUndefined()
    })

    test('corrupt persisted JSON is ignored and the store starts fresh', () => {
        localStorage.setItem(ATELIER_STORAGE_KEY, '{not json')
        const store = makeStore(persistentMap(ATELIER_STORAGE_KEY))
        store.registerAxis('physics', physicsSchema)
        expect(store.get().axes['physics']).toBeUndefined()
        expect(store.get().sets).toEqual({})
    })

    test('persisted working values survive baseline reconciliation after reload', () => {
        const store = makeStore(persistentMap(ATELIER_STORAGE_KEY))
        store.registerAxis('physics', physicsSchema)
        store.reconcileBaseline('physics', { gravityY: 0.7, buoyancyGain: 1.5 })
        store.setValues('physics', { gravityY: 2.0, buoyancyGain: 1.5 })

        const reborn = makeStore(persistentMap(ATELIER_STORAGE_KEY))
        reborn.registerAxis('physics', physicsSchema)
        reborn.reconcileBaseline('physics', { gravityY: 0.7, buoyancyGain: 1.5 })
        expect(reborn.get().axes['physics']).toEqual({ gravityY: 2.0, buoyancyGain: 1.5 })
        expect(reborn.dirtyPaths('physics')).toEqual(['gravityY'])
    })

    test('stale persisted values are sanitized against the schema via defaultsOf', () => {
        localStorage.setItem(
            ATELIER_STORAGE_KEY,
            JSON.stringify({
                axes: {
                    'tokens.dark': {
                        accent: 42, // wrong type — falls back to default
                        card: { borderWidth: 6 }, // shadow missing — backfilled
                        retired: 'junk', // unknown key — dropped
                    },
                },
                sets: {},
                activeSet: null,
            }),
        )
        const store = makeStore(persistentMap(ATELIER_STORAGE_KEY))
        store.registerAxis('tokens.dark', tokensSchema)
        expect(store.get().axes['tokens.dark']).toEqual({
            accent: '#aabbcc',
            card: { borderWidth: 6, shadow: true },
        })
    })
})
