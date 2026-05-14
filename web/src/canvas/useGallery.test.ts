import { describe, test, expect, beforeEach, vi } from 'vitest'

const STORAGE_KEY = 'chaipalaka.background.activeId'
const DEFAULT_ID = 'flow-shader'

beforeEach(() => {
    localStorage.clear()
    delete (window as unknown as { __setBackground?: unknown }).__setBackground
    vi.resetModules()
})

async function setup() {
    const rtl = await import('@testing-library/react')
    const { useGallery } = await import('./useGallery')
    const { BACKGROUND_SCENES } = await import('./scenes/registry')
    return { ...rtl, useGallery, backgroundScenes: BACKGROUND_SCENES }
}

describe('useGallery', () => {
    test('active reflects the default scene on mount with empty storage', async () => {
        const { renderHook, useGallery } = await setup()
        const { result } = renderHook(() => useGallery())
        expect(result.current.active.id).toBe(DEFAULT_ID)
    })

    test('setActive(known) updates active and persists to localStorage', async () => {
        const { renderHook, act, useGallery, backgroundScenes } = await setup()
        const otherId = backgroundScenes.find((s) => s.id !== DEFAULT_ID)?.id
        expect(otherId).toBeDefined()

        const { result } = renderHook(() => useGallery())

        act(() => {
            result.current.setActive(otherId!)
        })

        expect(result.current.active.id).toBe(otherId)
        expect(localStorage.getItem(STORAGE_KEY)).toBe(otherId)
    })

    test('setActive(unknown) is a no-op — active and storage unchanged', async () => {
        const { renderHook, act, useGallery } = await setup()
        const { result } = renderHook(() => useGallery())
        const before = result.current.active.id

        // gallery.setActive warns on unknown ids; silence it for this test.
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        act(() => {
            result.current.setActive('does-not-exist')
        })
        warnSpy.mockRestore()

        expect(result.current.active.id).toBe(before)
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    test('retired "particles" id migrates to "particles-starfield" on mount', async () => {
        localStorage.setItem(STORAGE_KEY, 'particles')
        const { renderHook, useGallery } = await setup()
        const { result } = renderHook(() => useGallery())
        expect(result.current.active.id).toBe('particles-starfield')
        expect(localStorage.getItem(STORAGE_KEY)).toBe('particles-starfield')
    })

    test('retired "geometric" id migrates to "geometric-reaction-diffusion" on mount', async () => {
        localStorage.setItem(STORAGE_KEY, 'geometric')
        const { renderHook, useGallery } = await setup()
        const { result } = renderHook(() => useGallery())
        expect(result.current.active.id).toBe('geometric-reaction-diffusion')
        expect(localStorage.getItem(STORAGE_KEY)).toBe(
            'geometric-reaction-diffusion',
        )
    })

    test('window.__setBackground is installed and drives active', async () => {
        const { renderHook, act, useGallery, backgroundScenes } = await setup()
        const otherId = backgroundScenes.find((s) => s.id !== DEFAULT_ID)?.id
        expect(otherId).toBeDefined()

        const { result } = renderHook(() => useGallery())
        expect(typeof window.__setBackground).toBe('function')

        act(() => {
            window.__setBackground(otherId!)
        })

        expect(result.current.active.id).toBe(otherId)
    })
})
