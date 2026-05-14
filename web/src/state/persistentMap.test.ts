import { describe, test, expect, beforeEach } from 'vitest'

import { persistentMap } from './persistentMap'

beforeEach(() => {
    localStorage.clear()
})

describe('persistentMap', () => {
    test('round-trips a value through get/set', () => {
        const m = persistentMap('chaipalaka.test.key')
        m.set('chaipalaka.test.key', 'hello')
        expect(m.get('chaipalaka.test.key')).toBe('hello')
    })

    test('set writes through to localStorage', () => {
        const m = persistentMap('chaipalaka.test.key')
        m.set('chaipalaka.test.key', 'world')
        expect(localStorage.getItem('chaipalaka.test.key')).toBe('world')
    })

    test('hydrates from an existing localStorage value on construction', () => {
        localStorage.setItem('chaipalaka.test.key', 'persisted')
        const m = persistentMap('chaipalaka.test.key')
        expect(m.get('chaipalaka.test.key')).toBe('persisted')
    })

    test('returns a plain in-memory Map when localStorage is undefined (SSR)', () => {
        const original = globalThis.localStorage
        // simulate SSG/SSR — happy-dom defines localStorage; remove it for this test.
        // @ts-expect-error narrow the global for this assertion
        delete globalThis.localStorage
        try {
            const m = persistentMap('chaipalaka.test.key')
            expect(() => m.set('chaipalaka.test.key', 'noop')).not.toThrow()
            expect(m.get('chaipalaka.test.key')).toBe('noop')
        } finally {
            globalThis.localStorage = original
        }
    })
})
