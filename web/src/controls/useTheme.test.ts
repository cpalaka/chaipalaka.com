import { describe, test, expect, beforeEach, vi } from 'vitest'

// useTheme holds a module-level controller singleton. To exercise the
// "fresh mount" code path between tests we reset modules and re-import
// both the hook and @testing-library/react so they share the same React
// instance.
beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.resetModules()
})

async function setup() {
    const rtl = await import('@testing-library/react')
    const { useTheme } = await import('./useTheme')
    return { ...rtl, useTheme }
}

describe('useTheme', () => {
    test('mount sets document.documentElement.dataset.theme to the current theme', async () => {
        const { renderHook, useTheme } = await setup()
        const { result } = renderHook(() => useTheme())
        expect(document.documentElement.dataset.theme).toBe(result.current.theme)
        expect(['dark', 'light']).toContain(result.current.theme)
    })

    test('cycleTheme updates the dataset attribute and the returned theme', async () => {
        const { renderHook, act, useTheme } = await setup()
        const { result } = renderHook(() => useTheme())
        const before = result.current.theme

        act(() => {
            result.current.cycleTheme()
        })

        const expected = before === 'dark' ? 'light' : 'dark'
        expect(result.current.theme).toBe(expected)
        expect(document.documentElement.dataset.theme).toBe(expected)
    })

    test('two components sharing the singleton both re-render on cycleTheme', async () => {
        const { renderHook, act, useTheme } = await setup()
        const a = renderHook(() => useTheme())
        const b = renderHook(() => useTheme())
        expect(a.result.current.theme).toBe(b.result.current.theme)
        const before = a.result.current.theme

        act(() => {
            a.result.current.cycleTheme()
        })

        const expected = before === 'dark' ? 'light' : 'dark'
        expect(a.result.current.theme).toBe(expected)
        expect(b.result.current.theme).toBe(expected)
    })

    test('persisted theme in localStorage is honoured on mount', async () => {
        localStorage.setItem('chaipalaka.theme', 'light')
        const { renderHook, useTheme } = await setup()
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('light')
        expect(document.documentElement.dataset.theme).toBe('light')
    })
})
