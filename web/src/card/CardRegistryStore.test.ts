import { describe, test, expect } from 'vitest'
import { CardRegistryStore } from './CardRegistry'
import type { RegisterArgs } from './CardRegistry'

const entryA: RegisterArgs = {
    id: 'a',
    parent: 'ceiling',
    kind: 'headline',
    buoyancy: 'heavy',
    anchor: { x: 100, y: 100 },
    content: { text: 'hello', width: 200, height: 100 },
}

describe('CardRegistryStore state machine', () => {
    test('register enters a new card in spawning state', () => {
        const store = new CardRegistryStore()
        store.arm()
        store.register(entryA)
        expect(store.snapshot()[0]?.state).toBe('spawning')
    })

    test('register without arm auto-activates via microtask', async () => {
        const store = new CardRegistryStore()
        store.register(entryA)
        expect(store.snapshot()[0]?.state).toBe('spawning')
        await Promise.resolve()
        expect(store.snapshot()[0]?.state).toBe('active')
    })

    test('arm() suppresses auto-activate', async () => {
        const store = new CardRegistryStore()
        store.arm()
        store.register(entryA)
        await Promise.resolve()
        expect(store.snapshot()[0]?.state).toBe('spawning')
    })

    test('disarm() restores auto-activate for subsequent registers', async () => {
        const store = new CardRegistryStore()
        store.arm()
        store.disarm()
        store.register(entryA)
        await Promise.resolve()
        expect(store.snapshot()[0]?.state).toBe('active')
    })

    test('activate() promotes spawning → active', () => {
        const store = new CardRegistryStore()
        store.arm()
        store.register(entryA)
        store.activate('a')
        expect(store.snapshot()[0]?.state).toBe('active')
    })

    test('activate() throws on missing id', () => {
        const store = new CardRegistryStore()
        expect(() => store.activate('nope')).toThrow(/nope/)
    })

    test('activate() throws on already-active card', () => {
        const store = new CardRegistryStore()
        store.arm()
        store.register(entryA)
        store.activate('a')
        expect(() => store.activate('a')).toThrow(/active.*active|illegal.*active/i)
    })

    test('activate() throws on exiting card', () => {
        const store = new CardRegistryStore()
        store.arm()
        store.register(entryA)
        store.markExiting('a')
        expect(() => store.activate('a')).toThrow(/exiting.*active|illegal.*active/i)
    })

    test('markExiting accepts a spawning card', () => {
        const store = new CardRegistryStore()
        store.arm()
        store.register(entryA)
        store.markExiting('a')
        expect(store.snapshot()[0]?.state).toBe('exiting')
    })

    test('auto-activate microtask is a no-op when card was marked exiting first', async () => {
        const store = new CardRegistryStore()
        store.register(entryA)
        store.markExiting('a')
        expect(store.snapshot()[0]?.state).toBe('exiting')
        await Promise.resolve()
        expect(store.snapshot()[0]?.state).toBe('exiting')
    })

    test('release on exiting card removes it', () => {
        const store = new CardRegistryStore()
        store.arm()
        store.register(entryA)
        store.markExiting('a')
        store.release('a')
        expect(store.snapshot()).toHaveLength(0)
    })

    test('disarm() activates EVERY card left spawning (chain coverage)', () => {
        const store = new CardRegistryStore()
        store.arm()
        const idsList = ['a', 'b', 'c', 'd', 'e'] as const
        for (const id of idsList) {
            store.register({ ...entryA, id })
        }
        // All armed → all spawning.
        for (const id of idsList) {
            expect(
                store.snapshot().find((e) => e.id === id)?.state,
            ).toBe('spawning')
        }
        store.disarm()
        for (const id of idsList) {
            expect(
                store.snapshot().find((e) => e.id === id)?.state,
            ).toBe('active')
        }
    })

    test('disarm() activates any cards left spawning by the primitive', () => {
        // Covers the case where a card registers WHILE armed (transition in
        // flight) but the primitive that owns activation never sees it —
        // e.g. routes whose card set materialises asynchronously after the
        // Director has already snapshotted the registry. On disarm, these
        // orphans must be promoted so they don't render visibility:hidden
        // forever.
        const store = new CardRegistryStore()
        store.arm()
        store.register(entryA)
        expect(store.snapshot()[0]?.state).toBe('spawning')
        store.disarm()
        expect(store.snapshot()[0]?.state).toBe('active')
    })
})
