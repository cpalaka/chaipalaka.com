import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { PinProvider, usePin } from './PinContext'
import { useAmbientPins } from './useAmbientPins'
import { saveRoute } from './pinPersistence'
import type { AmbientPinSpec } from './ambientPins'
import type { PinStore } from './PinStore'

afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
    localStorage.clear()
    vi.restoreAllMocks()
})

const SPECS: AmbientPinSpec[] = [
    {
        selector: 'a[data-link-type="portal"][href="/blog"]',
        kind: 'portal',
        title: 'Writing',
        href: '/blog',
    },
]

let captured: PinStore
function Host() {
    captured = usePin()
    useAmbientPins('populated', SPECS)
    return null
}

function renderApp(initialPath = '/blog') {
    const router = createMemoryRouter(
        [
            {
                path: '/blog',
                element: (
                    <PhysicsProvider>
                        <PinProvider>
                            <div data-content-box>
                                <a data-link-type="portal" href="/blog">
                                    writing
                                </a>
                            </div>
                            <Host />
                        </PinProvider>
                    </PhysicsProvider>
                ),
            },
        ],
        { initialEntries: [initialPath] },
    )
    render(<RouterProvider router={router} />)
    return captured
}

const flushRaf = () =>
    act(async () => {
        await new Promise((r) => requestAnimationFrame(() => r(null)))
    })

describe('useAmbientPins — persisted-wins guard (task-028)', () => {
    it('seeds the ambient teacher when the route has no persisted pins', async () => {
        const store = renderApp()
        await flushRaf()
        expect(store.snapshot()).toHaveLength(1)
    })

    it('does NOT seed when the route has persisted pins (persisted wins)', async () => {
        saveRoute('/blog', [
            {
                locator: { href: '/blog/x', nth: 0 },
                kind: 'portal',
                regime: 'word',
                offset: { dx: 0, dy: 120 },
                width: 240,
                height: 130,
            },
        ])
        const store = renderApp()
        await flushRaf()
        expect(store.snapshot()).toHaveLength(0)
    })
})
