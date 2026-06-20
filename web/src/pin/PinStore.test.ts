import { describe, it, expect, vi } from 'vitest'
import { PinStore, type PinSpec } from './PinStore'

const el = () => ({}) as unknown as Element
const spec = (over: Partial<PinSpec> = {}): PinSpec => ({
    sourceEl: el(),
    kind: 'portal',
    center: { x: 200, y: 200 },
    width: 300,
    height: 160,
    title: 'A link',
    ...over,
})

describe('PinStore', () => {
    it('pins a card and exposes it in the snapshot with an id', () => {
        const store = new PinStore()
        const id = store.pin(spec())
        const snap = store.snapshot()
        expect(snap).toHaveLength(1)
        expect(snap[0]!.id).toBe(id)
        expect(snap[0]!.kind).toBe('portal')
    })

    it('returns a stable snapshot reference until the set changes', () => {
        const store = new PinStore()
        store.pin(spec())
        const a = store.snapshot()
        expect(store.snapshot()).toBe(a) // cached
        store.pin(spec())
        expect(store.snapshot()).not.toBe(a) // invalidated
    })

    it('unpins a card', () => {
        const store = new PinStore()
        const id = store.pin(spec())
        store.unpin(id)
        expect(store.snapshot()).toHaveLength(0)
    })

    it('holds multiple independent pins', () => {
        const store = new PinStore()
        store.pin(spec({ kind: 'portal' }))
        store.pin(spec({ kind: 'pocket', bodyHtml: '<p>note</p>' }))
        expect(store.snapshot()).toHaveLength(2)
    })

    it('notifies subscribers on pin and unpin', () => {
        const store = new PinStore()
        const cb = vi.fn()
        store.subscribe(cb)
        const id = store.pin(spec())
        expect(cb).toHaveBeenCalledTimes(1)
        store.unpin(id)
        expect(cb).toHaveBeenCalledTimes(2)
    })
})
