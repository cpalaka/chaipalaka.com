import { describe, test, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
})

async function setup() {
    const rtl = await import('@testing-library/react')
    const { useFrameEdge } = await import('./useFrameEdge')
    return { ...rtl, useFrameEdge }
}

describe('useFrameEdge', () => {
    test('defaults to bottom on mount with empty storage', async () => {
        const { renderHook, useFrameEdge } = await setup()
        const { result } = renderHook(() => useFrameEdge())
        expect(result.current.edge).toBe('bottom')
    })

    test('setEdge re-renders the consuming component with the new edge', async () => {
        const { renderHook, act, useFrameEdge } = await setup()
        const { result } = renderHook(() => useFrameEdge())

        act(() => {
            result.current.setEdge('top')
        })

        expect(result.current.edge).toBe('top')
    })

    test('toggleEdge flips bottom → top and re-renders', async () => {
        const { renderHook, act, useFrameEdge } = await setup()
        const { result } = renderHook(() => useFrameEdge())
        expect(result.current.edge).toBe('bottom')

        act(() => {
            result.current.toggleEdge()
        })

        expect(result.current.edge).toBe('top')
    })

    test('two components sharing the singleton both update on setEdge', async () => {
        const { renderHook, act, useFrameEdge } = await setup()
        const a = renderHook(() => useFrameEdge())
        const b = renderHook(() => useFrameEdge())
        expect(a.result.current.edge).toBe('bottom')
        expect(b.result.current.edge).toBe('bottom')

        act(() => {
            a.result.current.setEdge('top')
        })

        expect(a.result.current.edge).toBe('top')
        expect(b.result.current.edge).toBe('top')
    })

    test('persisted edge in localStorage is honoured on mount', async () => {
        localStorage.setItem('chaipalaka.frame.edge', 'top')
        const { renderHook, useFrameEdge } = await setup()
        const { result } = renderHook(() => useFrameEdge())
        expect(result.current.edge).toBe('top')
    })
})
