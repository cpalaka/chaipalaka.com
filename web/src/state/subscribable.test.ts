import { describe, test, expect, vi } from 'vitest'

import { createSubscribable } from './subscribable'

describe('createSubscribable', () => {
    test('get() returns the initial value', () => {
        const s = createSubscribable(7)
        expect(s.get()).toBe(7)
    })

    test('set(next) updates the stored value', () => {
        const s = createSubscribable('a')
        s.set('b')
        expect(s.get()).toBe('b')
    })

    test('set(next) fires every subscriber with the next value', () => {
        const s = createSubscribable(0)
        const a = vi.fn()
        const b = vi.fn()
        s.subscribe(a)
        s.subscribe(b)
        s.set(42)
        expect(a).toHaveBeenCalledTimes(1)
        expect(a).toHaveBeenCalledWith(42)
        expect(b).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledWith(42)
    })

    test('subscribe does not fire on registration', () => {
        const s = createSubscribable('initial')
        const listener = vi.fn()
        s.subscribe(listener)
        expect(listener).not.toHaveBeenCalled()
    })

    test('unsubscribe stops firing for that listener but not others', () => {
        const s = createSubscribable(0)
        const a = vi.fn()
        const b = vi.fn()
        const unsubA = s.subscribe(a)
        s.subscribe(b)

        s.set(1)
        expect(a).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledTimes(1)

        unsubA()
        s.set(2)
        expect(a).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledTimes(2)
        expect(b).toHaveBeenLastCalledWith(2)
    })

    test('set with the same value still fires (no dedupe)', () => {
        const s = createSubscribable('same')
        const listener = vi.fn()
        s.subscribe(listener)
        s.set('same')
        s.set('same')
        expect(listener).toHaveBeenCalledTimes(2)
        expect(listener).toHaveBeenNthCalledWith(1, 'same')
        expect(listener).toHaveBeenNthCalledWith(2, 'same')
    })
})
