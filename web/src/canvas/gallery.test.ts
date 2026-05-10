import { describe, test, expect, vi } from 'vitest'
import { createGallery } from './gallery'
import { createRegistry } from './registry'
import type { BackgroundScene } from './types'

function makeScene(id: string, accentColor = '#aaaaaa'): BackgroundScene {
    return {
        id,
        Component: () => null,
        accentColor,
        fallbackColors: ['#000000', '#111111'],
        fallbackPng: `/fallbacks/${id}.png`,
    }
}

function makeStorage(initial: Record<string, string> = {}) {
    const store = { ...initial }
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value
        },
        _store: store,
    }
}

function makeRoot() {
    const props: Record<string, string> = {}
    return {
        style: {
            setProperty: (name: string, value: string) => {
                props[name] = value
            },
        },
        _props: props,
    }
}

const DEFAULT_ID = 'flow-shader'
const STORAGE_KEY = 'chaipalaka.background.activeId'

describe('BackgroundGallery', () => {
    test('uses default scene when storage is empty', () => {
        const flow = makeScene(DEFAULT_ID)
        const registry = createRegistry([flow, makeScene('particles')])
        const gallery = createGallery({
            registry,
            storage: makeStorage(),
            root: makeRoot(),
            defaultId: DEFAULT_ID,
        })
        expect(gallery.getActive().id).toBe(DEFAULT_ID)
    })

    test('uses persisted scene when storage holds a known id', () => {
        const flow = makeScene(DEFAULT_ID)
        const particles = makeScene('particles')
        const registry = createRegistry([flow, particles])
        const storage = makeStorage({ [STORAGE_KEY]: 'particles' })
        const gallery = createGallery({
            registry,
            storage,
            root: makeRoot(),
            defaultId: DEFAULT_ID,
        })
        expect(gallery.getActive().id).toBe('particles')
    })

    test('ignores persisted unknown id and falls back to default', () => {
        const flow = makeScene(DEFAULT_ID)
        const registry = createRegistry([flow])
        const storage = makeStorage({ [STORAGE_KEY]: 'does-not-exist' })
        const gallery = createGallery({
            registry,
            storage,
            root: makeRoot(),
            defaultId: DEFAULT_ID,
        })
        expect(gallery.getActive().id).toBe(DEFAULT_ID)
    })

    test('writes --color-accent on construction for initial active scene', () => {
        const flow = makeScene(DEFAULT_ID, '#c19a4b')
        const registry = createRegistry([flow])
        const root = makeRoot()
        createGallery({
            registry,
            storage: makeStorage(),
            root,
            defaultId: DEFAULT_ID,
        })
        expect(root._props['--color-accent']).toBe('#c19a4b')
    })

    test('setActive(known) persists to storage, updates accent, notifies subscribers', () => {
        const flow = makeScene(DEFAULT_ID, '#c19a4b')
        const particles = makeScene('particles', '#5fb6c4')
        const registry = createRegistry([flow, particles])
        const storage = makeStorage()
        const root = makeRoot()
        const gallery = createGallery({
            registry,
            storage,
            root,
            defaultId: DEFAULT_ID,
        })

        const listener = vi.fn()
        gallery.subscribe(listener)
        gallery.setActive('particles')

        expect(gallery.getActive().id).toBe('particles')
        expect(storage._store[STORAGE_KEY]).toBe('particles')
        expect(root._props['--color-accent']).toBe('#5fb6c4')
        expect(listener).toHaveBeenCalledOnce()
        expect(listener).toHaveBeenCalledWith(particles)
    })

    test('setActive(unknown) is a no-op — no storage write, no notification', () => {
        const flow = makeScene(DEFAULT_ID)
        const registry = createRegistry([flow])
        const storage = makeStorage()
        const root = makeRoot()
        const gallery = createGallery({
            registry,
            storage,
            root,
            defaultId: DEFAULT_ID,
        })

        const listener = vi.fn()
        gallery.subscribe(listener)
        gallery.setActive('does-not-exist')

        expect(gallery.getActive().id).toBe(DEFAULT_ID)
        expect(storage._store[STORAGE_KEY]).toBeUndefined()
        expect(listener).not.toHaveBeenCalled()
    })

    test('subscribe returns an unsubscribe that stops further notifications', () => {
        const flow = makeScene(DEFAULT_ID)
        const particles = makeScene('particles')
        const registry = createRegistry([flow, particles])
        const gallery = createGallery({
            registry,
            storage: makeStorage(),
            root: makeRoot(),
            defaultId: DEFAULT_ID,
        })

        const listener = vi.fn()
        const unsub = gallery.subscribe(listener)
        unsub()
        gallery.setActive('particles')

        expect(listener).not.toHaveBeenCalled()
    })

    test('register() adds a new scene so setActive can use it', () => {
        const flow = makeScene(DEFAULT_ID)
        const particles = makeScene('particles', '#5fb6c4')
        const registry = createRegistry([flow])
        const gallery = createGallery({
            registry,
            storage: makeStorage(),
            root: makeRoot(),
            defaultId: DEFAULT_ID,
        })

        gallery.register(particles)
        gallery.setActive('particles')
        expect(gallery.getActive().id).toBe('particles')
    })
})
