import { describe, test, expect, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type ChangeHandler = (e: MediaQueryListEvent) => void

interface FakeMQL {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
}

function makeFakeMQL(matches: boolean): FakeMQL {
    return {
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }
}

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

describe('usePrefersReducedMotion', () => {
    test('returns false when matchMedia reports matches: false', () => {
        const mq = makeFakeMQL(false)
        vi.spyOn(window, 'matchMedia').mockReturnValue(
            mq as unknown as MediaQueryList,
        )
        const { result } = renderHook(() => usePrefersReducedMotion())
        expect(result.current).toBe(false)
    })

    test('returns true after mount when matchMedia reports matches: true', () => {
        const mq = makeFakeMQL(true)
        vi.spyOn(window, 'matchMedia').mockReturnValue(
            mq as unknown as MediaQueryList,
        )
        const { result } = renderHook(() => usePrefersReducedMotion())
        expect(result.current).toBe(true)
    })

    test('re-renders when the change handler fires with a new matches value', () => {
        const mq = makeFakeMQL(false)
        vi.spyOn(window, 'matchMedia').mockReturnValue(
            mq as unknown as MediaQueryList,
        )
        const { result } = renderHook(() => usePrefersReducedMotion())
        expect(result.current).toBe(false)

        const handler = mq.addEventListener.mock.calls[0]?.[1] as
            | ChangeHandler
            | undefined
        expect(typeof handler).toBe('function')

        act(() => {
            handler!({ matches: true } as MediaQueryListEvent)
        })
        expect(result.current).toBe(true)

        act(() => {
            handler!({ matches: false } as MediaQueryListEvent)
        })
        expect(result.current).toBe(false)
    })

    test('removes the change listener on unmount', () => {
        const mq = makeFakeMQL(false)
        vi.spyOn(window, 'matchMedia').mockReturnValue(
            mq as unknown as MediaQueryList,
        )
        const { unmount } = renderHook(() => usePrefersReducedMotion())
        const handler = mq.addEventListener.mock.calls[0]?.[1] as ChangeHandler
        expect(mq.removeEventListener).not.toHaveBeenCalled()

        unmount()

        expect(mq.removeEventListener).toHaveBeenCalledTimes(1)
        expect(mq.removeEventListener).toHaveBeenCalledWith('change', handler)
    })

    test('returns false and does not throw when window.matchMedia is undefined', () => {
        vi.stubGlobal('matchMedia', undefined)
        const { result } = renderHook(() => usePrefersReducedMotion())
        expect(result.current).toBe(false)
    })
})
