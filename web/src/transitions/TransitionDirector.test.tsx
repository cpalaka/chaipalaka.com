import { describe, test, expect, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { useState } from 'react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { TransitionDirector } from './TransitionDirector'
import { PhysicsLayer } from './PhysicsLayer'
import { PageDefRegistryProvider } from './PageDefRegistry'
import { PhysicsCard } from '../physics/PhysicsCard'
import type { PageDef } from '../physics/PageDef'

afterEach(() => {
    cleanup()
})

const pageDefA: PageDef = {
    gravity: 'down',
    cards: [
        {
            id: 'card-a',
            kind: 'headline',
            parent: 'ceiling',
            anchor: () => ({ x: 100, y: 100 }),
        },
    ],
}

const pageDefB: PageDef = {
    gravity: 'down',
    cards: [
        {
            id: 'card-b',
            kind: 'headline',
            parent: 'ceiling',
            anchor: () => ({ x: 200, y: 200 }),
        },
    ],
}

const pageDefs: Record<string, PageDef> = {
    '/a': pageDefA,
    '/b': pageDefB,
}

function RouteA() {
    return (
        <PhysicsCard
            id="card-a"
            text="A content"
            width={200}
            height={100}
            anchor={{ x: 100, y: 100 }}
            parent="ceiling"
        />
    )
}

function RouteB() {
    return (
        <PhysicsCard
            id="card-b"
            text="B content"
            width={200}
            height={100}
            anchor={{ x: 200, y: 200 }}
            parent="ceiling"
        />
    )
}

function NavigateButton({ to, label }: { to: string; label: string }) {
    const nav = useNavigate()
    return (
        <button type="button" onClick={() => nav(to)} data-testid={label}>
            {label}
        </button>
    )
}

function Harness() {
    return (
        <MemoryRouter initialEntries={['/a']}>
            <PhysicsProvider>
                <PageDefRegistryProvider>
                    <TransitionDirector pageDefs={pageDefs}>
                        <PhysicsLayer />
                        <NavigateButton to="/a" label="go-a" />
                        <NavigateButton to="/b" label="go-b" />
                        <Routes>
                            <Route path="/a" element={<RouteA />} />
                            <Route path="/b" element={<RouteB />} />
                        </Routes>
                    </TransitionDirector>
                </PageDefRegistryProvider>
            </PhysicsProvider>
        </MemoryRouter>
    )
}

describe('TransitionDirector — orphan card survival', () => {
    test('card from old route remains in DOM immediately after navigation', () => {
        const { container, getByTestId } = render(<Harness />)

        // Route A is mounted; its card should be in DOM.
        expect(container.querySelector('[data-card-id="card-a"]')).toBeTruthy()

        // Navigate to /b. The PhysicsCard registrar for /a unmounts, but the director
        // should have marked card-a as exiting in its layout effect, so the registry
        // (and therefore PhysicsLayer) keeps rendering it.
        act(() => {
            getByTestId('go-b').click()
        })

        // After navigation, card-a's article should still be in the DOM — its
        // exit motion is in flight, RAF hasn't fired yet to release the entry.
        expect(container.querySelector('[data-card-id="card-a"]')).toBeTruthy()
        // The new route's card is also present.
        expect(container.querySelector('[data-card-id="card-b"]')).toBeTruthy()
    })
})

describe('TransitionDirector — lifecycle arming', () => {
    test('newly-registered cards remain spawning across a microtask flush during a transition', async () => {
        const { container, getByTestId } = render(<Harness />)

        // Let card-a's initial auto-activate microtask settle.
        await act(async () => {
            await Promise.resolve()
        })

        act(() => {
            getByTestId('go-b').click()
        })

        // Flush microtasks — without arm(), card-b's default-policy
        // auto-activate would fire here and the article would become
        // visible. With arm() in the director's Phase-1 effect, the
        // registry suppresses the microtask and card-b stays spawning.
        await act(async () => {
            await Promise.resolve()
        })

        const cardB = container.querySelector(
            '[data-card-id="card-b"]',
        ) as HTMLElement
        expect(cardB).toBeTruthy()
        expect(cardB.style.visibility).toBe('hidden')
    })
})

describe('TransitionDirector — provider mount', () => {
    test('mounts and unmounts without throwing', () => {
        function Inner() {
            const [path] = useState('/a')
            return (
                <MemoryRouter initialEntries={[path]} key={path}>
                    <PhysicsProvider>
                        <PageDefRegistryProvider>
                            <TransitionDirector pageDefs={pageDefs}>
                                <PhysicsLayer />
                                <Routes>
                                    <Route path="/a" element={<RouteA />} />
                                    <Route path="/b" element={<RouteB />} />
                                </Routes>
                            </TransitionDirector>
                        </PageDefRegistryProvider>
                    </PhysicsProvider>
                </MemoryRouter>
            )
        }
        expect(() => render(<Inner />)).not.toThrow()
    })
})
