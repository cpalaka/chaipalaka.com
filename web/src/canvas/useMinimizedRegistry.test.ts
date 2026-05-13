import { describe, test, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
})

async function setup() {
    const rtl = await import('@testing-library/react')
    const hooks = await import('./useMinimizedRegistry')
    return { ...rtl, ...hooks }
}

describe('useMinimizedRegistry — singleton identity', () => {
    test('returns the same registry instance across hook invocations', async () => {
        const { renderHook, useMinimizedRegistry } = await setup()
        const { result: a } = renderHook(() => useMinimizedRegistry())
        const { result: b } = renderHook(() => useMinimizedRegistry())
        expect(a.current).toBe(b.current)
    })
})

describe('useMinimizedEntries — initial state', () => {
    test('returns an empty array when nothing is minimized', async () => {
        const { renderHook, useMinimizedEntries } = await setup()
        const { result } = renderHook(() => useMinimizedEntries())
        expect(result.current).toEqual([])
    })
})

describe('useMinimizedEntries — cross-component subscription', () => {
    test('two consumers both re-render when registry.minimize is called', async () => {
        const {
            renderHook,
            act,
            useMinimizedEntries,
            useMinimizedRegistry,
        } = await setup()

        const reg = renderHook(() => useMinimizedRegistry()).result.current
        const { result: a } = renderHook(() => useMinimizedEntries())
        const { result: b } = renderHook(() => useMinimizedEntries())

        expect(a.current).toEqual([])
        expect(b.current).toEqual([])

        act(() => {
            reg.minimize('card-1', { label: 'One', kind: 'card' })
        })

        expect(a.current).toHaveLength(1)
        expect(b.current).toHaveLength(1)
        expect(a.current[0]?.id).toBe('card-1')
        expect(b.current[0]?.id).toBe('card-1')
    })
})

describe('useIsMinimized', () => {
    test('returns true when the id is in a minimized entry’s members', async () => {
        const {
            renderHook,
            act,
            useIsMinimized,
            useMinimizedRegistry,
        } = await setup()

        const reg = renderHook(() => useMinimizedRegistry()).result.current
        const { result } = renderHook(() => useIsMinimized('card-1'))

        expect(result.current).toBe(false)

        act(() => {
            reg.minimize('card-1', { label: 'One', kind: 'card' })
        })

        expect(result.current).toBe(true)
    })

    test('returns false when only other ids are minimized', async () => {
        const {
            renderHook,
            act,
            useIsMinimized,
            useMinimizedRegistry,
        } = await setup()

        const reg = renderHook(() => useMinimizedRegistry()).result.current
        const { result } = renderHook(() => useIsMinimized('card-a'))

        act(() => {
            reg.minimize('card-b', { label: 'B', kind: 'card' })
        })

        expect(result.current).toBe(false)
    })

    test('returns false for undefined id regardless of registry state', async () => {
        const {
            renderHook,
            act,
            useIsMinimized,
            useMinimizedRegistry,
        } = await setup()

        const reg = renderHook(() => useMinimizedRegistry()).result.current
        const { result } = renderHook(() => useIsMinimized(undefined))

        expect(result.current).toBe(false)

        act(() => {
            reg.minimize('card-1', { label: 'One', kind: 'card' })
        })

        expect(result.current).toBe(false)
    })
})

describe('useMinimizedEntries — cleanup on unmount', () => {
    test('subscribe’s returned unsubscribe is called when the hook unmounts', async () => {
        const { renderHook, useMinimizedEntries, useMinimizedRegistry } =
            await setup()

        const reg = renderHook(() => useMinimizedRegistry()).result.current

        const unsubscribeSpy = vi.fn()
        const subscribeSpy = vi
            .spyOn(reg, 'subscribe')
            .mockImplementation(() => unsubscribeSpy)

        const { unmount } = renderHook(() => useMinimizedEntries())
        expect(subscribeSpy).toHaveBeenCalledTimes(1)

        unmount()
        expect(unsubscribeSpy).toHaveBeenCalledTimes(1)
    })
})
