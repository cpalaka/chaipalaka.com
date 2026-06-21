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

    it('clear drops every pin and notifies once; a no-op when empty', () => {
        const store = new PinStore()
        store.pin(spec())
        store.pin(spec({ kind: 'pocket', bodyHtml: '<p>n</p>' }))
        const cb = vi.fn()
        store.subscribe(cb)
        store.clear()
        expect(store.snapshot()).toHaveLength(0)
        expect(cb).toHaveBeenCalledTimes(1)
        store.clear()
        expect(cb).toHaveBeenCalledTimes(1) // empty → no notify
    })

    it('carries a locator and initialRegime through to the snapshot (task-028)', () => {
        const store = new PinStore()
        store.pin(
            spec({
                locator: { href: '/blog', nth: 0 },
                initialRegime: 'parked-bottom',
            }),
        )
        const e = store.snapshot()[0]!
        expect(e.locator).toEqual({ href: '/blog', nth: 0 })
        expect(e.initialRegime).toBe('parked-bottom')
    })

    it('registers a describer and pulls its runtime via describe(id)', () => {
        const store = new PinStore()
        const id = store.pin(spec())
        expect(store.describe(id)).toBeNull() // none registered yet
        store.setDescriber(id, () => ({
            regime: 'parked-top',
            offset: { dx: 5, dy: -10 },
        }))
        expect(store.describe(id)).toEqual({
            regime: 'parked-top',
            offset: { dx: 5, dy: -10 },
        })
    })

    it('drops describers on unpin and clear', () => {
        const store = new PinStore()
        const a = store.pin(spec())
        const b = store.pin(spec())
        store.setDescriber(a, () => ({ regime: 'word', offset: { dx: 0, dy: 0 } }))
        store.setDescriber(b, () => ({ regime: 'word', offset: { dx: 0, dy: 0 } }))
        store.unpin(a)
        expect(store.describe(a)).toBeNull()
        store.clear()
        expect(store.describe(b)).toBeNull()
    })

    it('describing across all entries does not notify subscribers (no re-render)', () => {
        const store = new PinStore()
        const id = store.pin(spec())
        store.setDescriber(id, () => ({ regime: 'word', offset: { dx: 1, dy: 2 } }))
        const cb = vi.fn()
        store.subscribe(cb)
        store.describe(id)
        expect(cb).not.toHaveBeenCalled()
    })
})
