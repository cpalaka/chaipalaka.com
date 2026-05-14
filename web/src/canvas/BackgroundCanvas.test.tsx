import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const STORAGE_KEY = 'chaipalaka.background.activeId'

beforeEach(() => {
    localStorage.clear()
    delete (window as unknown as { __setBackground?: unknown }).__setBackground
    vi.resetModules()
    vi.restoreAllMocks()
    vi.useRealTimers()
})

async function setupFallback() {
    vi.doMock('./detect-webgl', () => ({ detectWebGL: () => false }))
    vi.doMock('../lib/usePrefersReducedMotion', () => ({
        usePrefersReducedMotion: () => false,
    }))
    const rtl = await import('@testing-library/react')
    const { BackgroundCanvas } = await import('./BackgroundCanvas')
    const { BACKGROUND_SCENES } = await import('./scenes/registry')
    return { ...rtl, BackgroundCanvas, backgroundScenes: BACKGROUND_SCENES }
}

async function setupWebGL() {
    vi.doMock('./detect-webgl', () => ({ detectWebGL: () => true }))
    vi.doMock('../lib/usePrefersReducedMotion', () => ({
        usePrefersReducedMotion: () => false,
    }))
    const rtl = await import('@testing-library/react')
    const { BackgroundCanvas } = await import('./BackgroundCanvas')
    return { ...rtl, BackgroundCanvas }
}

async function setupReducedMotion() {
    vi.doMock('./detect-webgl', () => ({ detectWebGL: () => true }))
    vi.doMock('../lib/usePrefersReducedMotion', () => ({
        usePrefersReducedMotion: () => true,
    }))
    const rtl = await import('@testing-library/react')
    const { BackgroundCanvas } = await import('./BackgroundCanvas')
    return { ...rtl, BackgroundCanvas }
}

describe('BackgroundCanvas — initial render before post-mount effect', () => {
    test('returns null on first render (mode is pending)', async () => {
        // renderToStaticMarkup does not run effects, so we observe the
        // pre-effect render path: useState('pending') → return null.
        vi.doMock('./detect-webgl', () => ({ detectWebGL: () => false }))
        vi.doMock('../lib/usePrefersReducedMotion', () => ({
            usePrefersReducedMotion: () => false,
        }))
        const { BackgroundCanvas } = await import('./BackgroundCanvas')
        const html = renderToStaticMarkup(<BackgroundCanvas />)
        expect(html).toBe('')
    })
})

describe('BackgroundCanvas — fallback path', () => {
    test('renders the fallback img wrapper after mount when detectWebGL is false', async () => {
        const { render, BackgroundCanvas, backgroundScenes } =
            await setupFallback()
        const { container } = render(<BackgroundCanvas />)

        const outer = container.querySelector(
            'div.background-canvas-layer[aria-hidden="true"]',
        )
        expect(outer).toBeTruthy()

        const inner = outer!.querySelector('div.background-canvas-layer__layer')
        expect(inner).toBeTruthy()

        const img = inner!.querySelector('img.background-canvas-fallback')
        expect(img).toBeTruthy()

        const defaultScene = backgroundScenes.find((s) => s.id === 'flow-shader')
        expect(img!.getAttribute('src')).toBe(defaultScene!.fallbackPng)
        expect(img!.getAttribute('alt')).toBe('')
    })
})

describe('BackgroundCanvas — WebGL path', () => {
    test('does not render the fallback img when detectWebGL is true', async () => {
        // <Canvas> tries to create a real WebGL context. Under happy-dom it
        // logs errors; suppress them for the duration of this test only.
        const errSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        const { render, BackgroundCanvas } = await setupWebGL()
        const { container } = render(<BackgroundCanvas />)

        const outer = container.querySelector(
            'div.background-canvas-layer[aria-hidden="true"]',
        )
        expect(outer).toBeTruthy()

        // The defining assertion: in webgl mode, no fallback image is rendered.
        const fallback = container.querySelector('img.background-canvas-fallback')
        expect(fallback).toBeNull()

        errSpy.mockRestore()
    })
})

describe('BackgroundCanvas — reduced motion override', () => {
    test('forces fallback img even when detectWebGL is true', async () => {
        const { render, BackgroundCanvas } = await setupReducedMotion()
        const { container } = render(<BackgroundCanvas />)

        const fallback = container.querySelector('img.background-canvas-fallback')
        expect(fallback).toBeTruthy()
    })
})

describe('BackgroundCanvas — cross-fade between scenes', () => {
    test('shows two layers during fade window, then collapses after 300ms', async () => {
        vi.useFakeTimers()
        const { render, act, BackgroundCanvas, backgroundScenes } =
            await setupFallback()
        const { container } = render(<BackgroundCanvas />)

        // Sanity: one layer initially.
        let layers = container.querySelectorAll(
            'div.background-canvas-layer__layer',
        )
        expect(layers).toHaveLength(1)

        // Drive the gallery to a different scene via the debug hook installed
        // by useGallery's effect after mount.
        const otherId = backgroundScenes.find((s) => s.id !== 'flow-shader')!.id
        act(() => {
            window.__setBackground(otherId)
        })

        // During the fade window: outgoing + current both mounted.
        layers = container.querySelectorAll(
            'div.background-canvas-layer__layer',
        )
        expect(layers).toHaveLength(2)
        const fadingOut = container.querySelectorAll(
            'div.background-canvas-layer__layer[data-fading="out"]',
        )
        expect(fadingOut).toHaveLength(1)

        // After the 300ms timer fires, the outgoing layer is unmounted.
        act(() => {
            vi.advanceTimersByTime(350)
        })

        layers = container.querySelectorAll(
            'div.background-canvas-layer__layer',
        )
        expect(layers).toHaveLength(1)
        expect(
            container.querySelector(
                'div.background-canvas-layer__layer[data-fading="out"]',
            ),
        ).toBeNull()
    })
})

describe('BackgroundCanvas — getLazyScene', () => {
    test('returns the same lazy wrapper for the same scene id (cached)', async () => {
        const { getLazyScene } = await import('./BackgroundCanvas')
        const { BACKGROUND_SCENES } = await import('./scenes/registry')
        const scene = BACKGROUND_SCENES[0]!
        const a = getLazyScene(scene)
        const b = getLazyScene(scene)
        expect(a).toBe(b)
    })

    test('throws when scene.id is not in the registry', async () => {
        const { getLazyScene } = await import('./BackgroundCanvas')
        const fakeScene = {
            id: 'does-not-exist' as never,
            accentColor: '#000',
            fallbackColors: ['#000', '#000'] as const,
            fallbackPng: '/fake.png',
        }
        expect(() => getLazyScene(fakeScene)).toThrow(/does-not-exist/)
    })
})

describe('BackgroundCanvas — WebGL context lost', () => {
    // happy-dom cannot mount @react-three/fiber's <Canvas> (no real WebGL
    // context). We cannot synthesise a 'webglcontextlost' event on a canvas
    // that never mounted, so this branch is covered by visual/manual QA only.
    test.skip('synthesised webglcontextlost switches to fallback (skipped: needs real WebGL)', () => {})
})

// Use STORAGE_KEY to keep TS happy while keeping the constant nearby for future tests.
void STORAGE_KEY
