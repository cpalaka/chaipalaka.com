import { describe, it, expect, vi } from 'vitest'
import { PeekStore } from './PeekStore'

const portal = (sourceId: string) =>
    ({
        sourceId,
        kind: 'portal',
        title: sourceId,
        center: { x: 0, y: 0 },
        side: 'right',
        width: 300,
    }) as const

describe('PeekStore', () => {
    it('open adds a held preview and returns its id', () => {
        const s = new PeekStore()
        const id = s.open(portal('a'))
        const entries = s.snapshot()
        expect(entries).toHaveLength(1)
        expect(entries[0]).toMatchObject({ id, sourceId: 'a', phase: 'held' })
    })

    it('opening a different source dismisses the prior held preview (one held at a time)', () => {
        const s = new PeekStore()
        const first = s.open(portal('a'))
        s.open(portal('b'))
        const byId = Object.fromEntries(s.snapshot().map((e) => [e.id, e]))
        expect(byId[first]?.phase).toBe('falling')
        expect(s.snapshot().filter((e) => e.phase === 'held')).toHaveLength(1)
    })

    it('opening the same source that is already held is a no-op (no re-spawn)', () => {
        const s = new PeekStore()
        const id1 = s.open(portal('a'))
        const id2 = s.open(portal('a'))
        expect(id2).toBe(id1)
        expect(s.snapshot()).toHaveLength(1)
    })

    it('dismiss moves a held preview to falling', () => {
        const s = new PeekStore()
        const id = s.open(portal('a'))
        s.dismiss(id)
        expect(s.snapshot()[0]?.phase).toBe('falling')
    })

    it('remove deletes the entry', () => {
        const s = new PeekStore()
        const id = s.open(portal('a'))
        s.remove(id)
        expect(s.snapshot()).toHaveLength(0)
    })

    it('notifies subscribers on every change', () => {
        const s = new PeekStore()
        const cb = vi.fn()
        const unsub = s.subscribe(cb)
        const id = s.open(portal('a'))
        s.dismiss(id)
        s.remove(id)
        expect(cb).toHaveBeenCalledTimes(3)
        unsub()
        s.open(portal('b'))
        expect(cb).toHaveBeenCalledTimes(3)
    })

    it('clear drops every entry and notifies once; a no-op when empty', () => {
        const s = new PeekStore()
        s.open(portal('a'))
        s.open(portal('b'))
        const cb = vi.fn()
        s.subscribe(cb)
        s.clear()
        expect(s.snapshot()).toHaveLength(0)
        expect(cb).toHaveBeenCalledTimes(1)
        s.clear()
        expect(cb).toHaveBeenCalledTimes(1) // empty → no notify
    })
})
