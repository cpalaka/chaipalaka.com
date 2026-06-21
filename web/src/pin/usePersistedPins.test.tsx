import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { PinProvider, usePin } from './PinContext'
import { PinLayer } from './PinLayer'
import { usePersistedPins } from './usePersistedPins'
import { loadRoute, saveRoute, type PersistedPin } from './pinPersistence'
import type { PinStore } from './PinStore'

afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
    localStorage.clear()
    vi.restoreAllMocks()
})

let captured: PinStore
function Host() {
    captured = usePin()
    usePersistedPins() // the per-route save/clear/restore lifecycle under test
    return null
}

// A layout route (providers + the persistence host + a content box) rendered for
// every path, mirroring ContentBoxLayout. `boxHtml` is the route's prose (where
// the source words live for restore resolution).
function renderApp(boxHtml: string, initialPath = '/blog') {
    const Layout = () => (
        <PhysicsProvider>
            <PinProvider>
                <div
                    data-content-box
                    dangerouslySetInnerHTML={{ __html: boxHtml }}
                />
                <PinLayer />
                <Host />
                <Outlet />
            </PinProvider>
        </PhysicsProvider>
    )
    const router = createMemoryRouter(
        [
            {
                path: '/',
                element: <Layout />,
                children: [
                    { path: 'blog', element: null },
                    { path: 'other', element: null },
                ],
            },
        ],
        { initialEntries: [initialPath] },
    )
    render(<RouterProvider router={router} />)
    return { store: captured, router }
}

const keep = (store: PinStore) => {
    const word = document.querySelector('a')!
    store.pin({
        sourceEl: word,
        kind: 'portal',
        center: { x: 100, y: 220 },
        width: 240,
        height: 130,
        href: '/blog/x',
        locator: { href: '/blog/x', nth: 0 },
    })
}

const flushRaf = () =>
    act(async () => {
        await new Promise((r) => requestAnimationFrame(() => r(null)))
    })

const persisted = (): PersistedPin => ({
    locator: { href: '/blog/x', nth: 0 },
    kind: 'portal',
    regime: 'word',
    offset: { dx: 0, dy: 120 },
    width: 240,
    height: 130,
    title: 'T',
    lead: 'L',
    href: '/blog/x',
})

describe('usePersistedPins (task-028)', () => {
    it('saves a route’s kept pins to localStorage on pagehide', () => {
        const { store } = renderApp('<a data-link-type="portal" href="/blog/x">x</a>')
        act(() => keep(store))
        act(() => window.dispatchEvent(new Event('pagehide')))
        const saved = loadRoute('/blog')
        expect(saved).toHaveLength(1)
        expect(saved[0]!.locator).toEqual({ href: '/blog/x', nth: 0 })
        expect(saved[0]!.kind).toBe('portal')
    })

    it('does not write a route that has no kept pins', () => {
        renderApp('<a data-link-type="portal" href="/blog/x">x</a>')
        act(() => window.dispatchEvent(new Event('pagehide')))
        expect(localStorage.getItem('chaipalaka.pins:/blog')).toBeNull()
    })

    it('saves the outgoing route on navigation', async () => {
        const { store, router } = renderApp(
            '<a data-link-type="portal" href="/blog/x">x</a>',
        )
        act(() => keep(store))
        await act(async () => {
            await router.navigate('/other')
        })
        expect(loadRoute('/blog')).toHaveLength(1)
    })

    it('restores persisted pins for a route on mount', async () => {
        saveRoute('/blog', [persisted()])
        const { store } = renderApp('<a data-link-type="portal" href="/blog/x">x</a>')
        await flushRaf()
        const snap = store.snapshot()
        expect(snap).toHaveLength(1)
        expect(snap[0]!.locator).toEqual({ href: '/blog/x', nth: 0 })
        expect(snap[0]!.initialRegime).toBe('word')
    })

    it('drops a persisted pin whose source word is gone (stale, no crash)', async () => {
        saveRoute('/blog', [persisted()])
        const { store } = renderApp('<p>the link was removed</p>')
        await flushRaf()
        expect(store.snapshot()).toHaveLength(0)
    })
})
