import { describe, test, expect, vi } from 'vitest'
import { createMinimizedRegistry } from './MinimizedRegistry'

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
    return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect
}

describe('MinimizedRegistry', () => {
    test('list() is empty on creation', () => {
        const reg = createMinimizedRegistry()
        expect(reg.list()).toEqual([])
    })

    test('minimize() adds an entry; list() reflects it', () => {
        const reg = createMinimizedRegistry()
        reg.minimize('card-1', { label: 'Books', kind: 'lifelog' })
        expect(reg.list()).toHaveLength(1)
        expect(reg.list()[0]).toMatchObject({ id: 'card-1', label: 'Books', kind: 'lifelog' }) // list()[0] non-null proven by toHaveLength check above
    })

    test('list() preserves insertion order', () => {
        const reg = createMinimizedRegistry()
        reg.minimize('a', { label: 'A', kind: 'k' })
        reg.minimize('b', { label: 'B', kind: 'k' })
        reg.minimize('c', { label: 'C', kind: 'k' })
        expect(reg.list().map((e) => e.id)).toEqual(['a', 'b', 'c'])
    })

    test('minimize() stores fromRect when provided', () => {
        const reg = createMinimizedRegistry()
        const rect = makeRect(10, 20, 300, 200)
        reg.minimize('card-1', { label: 'Books', kind: 'lifelog', fromRect: rect })
        expect(reg.list()[0]?.fromRect).toBe(rect)
    })

    test('restore() removes entry and returns snapshot', () => {
        const reg = createMinimizedRegistry()
        reg.minimize('card-1', { label: 'Books', kind: 'lifelog' })
        const snapshot = reg.restore('card-1')
        expect(snapshot).toMatchObject({ id: 'card-1', label: 'Books', kind: 'lifelog' })
        expect(reg.list()).toHaveLength(0)
    })

    test('restore(unknownId) returns null and does not throw', () => {
        const reg = createMinimizedRegistry()
        expect(reg.restore('does-not-exist')).toBeNull()
    })

    test('subscribe is called on minimize', () => {
        const reg = createMinimizedRegistry()
        const listener = vi.fn()
        reg.subscribe(listener)
        reg.minimize('card-1', { label: 'Books', kind: 'lifelog' })
        expect(listener).toHaveBeenCalledOnce()
        expect(listener).toHaveBeenCalledWith(reg.list())
    })

    test('subscribe is called on restore', () => {
        const reg = createMinimizedRegistry()
        reg.minimize('card-1', { label: 'Books', kind: 'lifelog' })
        const listener = vi.fn()
        reg.subscribe(listener)
        reg.restore('card-1')
        expect(listener).toHaveBeenCalledOnce()
        expect(listener).toHaveBeenCalledWith([])
    })

    test('restore(unknownId) does not call listeners', () => {
        const reg = createMinimizedRegistry()
        const listener = vi.fn()
        reg.subscribe(listener)
        reg.restore('does-not-exist')
        expect(listener).not.toHaveBeenCalled()
    })

    test('unsubscribe stops further notifications', () => {
        const reg = createMinimizedRegistry()
        const listener = vi.fn()
        const unsub = reg.subscribe(listener)
        unsub()
        reg.minimize('card-1', { label: 'Books', kind: 'lifelog' })
        expect(listener).not.toHaveBeenCalled()
    })

    test('restore() stashes fromChipRect; consumeRestoreRect() returns it once', () => {
        const reg = createMinimizedRegistry()
        reg.minimize('card-1', { label: 'Books', kind: 'lifelog' })
        const chipRect = makeRect(5, 36, 80, 28)
        reg.restore('card-1', chipRect)
        expect(reg.consumeRestoreRect('card-1')).toBe(chipRect)
        expect(reg.consumeRestoreRect('card-1')).toBeNull()
    })

    test('consumeRestoreRect() returns null when no restore-rect stashed', () => {
        const reg = createMinimizedRegistry()
        expect(reg.consumeRestoreRect('anything')).toBeNull()
    })
})
