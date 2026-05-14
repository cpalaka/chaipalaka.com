import { describe, test, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useController, type Controller } from './useController'

function makeFakeController<T>(initial: T): Controller<T> & {
    emit: (next: T) => void
} {
    let current = initial
    const listeners = new Set<(next: T) => void>()
    return {
        get: () => current,
        subscribe(cb) {
            listeners.add(cb)
            return () => listeners.delete(cb)
        },
        emit(next) {
            current = next
            for (const cb of listeners) cb(current)
        },
    }
}

describe('useController', () => {
    test('returns the controller’s current value on mount via get()', () => {
        const ctrl = makeFakeController('initial')
        const { result } = renderHook(() => useController(() => ctrl))
        expect(result.current).toBe('initial')
    })

    test('re-renders the consumer when the controller emits a new value', () => {
        const ctrl = makeFakeController('one')
        const { result } = renderHook(() => useController(() => ctrl))
        expect(result.current).toBe('one')

        act(() => {
            ctrl.emit('two')
        })

        expect(result.current).toBe('two')
    })

    test('two consumers sharing a singleton both update on emit', () => {
        const ctrl = makeFakeController('one')
        const getInstance = () => ctrl
        const a = renderHook(() => useController(getInstance))
        const b = renderHook(() => useController(getInstance))
        expect(a.result.current).toBe('one')
        expect(b.result.current).toBe('one')

        act(() => {
            ctrl.emit('two')
        })

        expect(a.result.current).toBe('two')
        expect(b.result.current).toBe('two')
    })

    test('unsubscribes on unmount — no further notifications', () => {
        const ctrl = makeFakeController('one')
        let unsubCalls = 0
        const originalSubscribe = ctrl.subscribe
        ctrl.subscribe = (cb) => {
            const unsub = originalSubscribe(cb)
            return () => {
                unsubCalls++
                unsub()
            }
        }

        const { result, unmount } = renderHook(() => useController(() => ctrl))
        expect(unsubCalls).toBe(0)
        unmount()
        expect(unsubCalls).toBe(1)

        // After unmount, emitting must not throw and must not affect the snapshot.
        act(() => {
            ctrl.emit('three')
        })
        expect(result.current).toBe('one')
    })
})
