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

async function flushRafs(count: number) {
    for (let i = 0; i < count; i++) {
        await act(async () => {
            await new Promise<void>((r) =>
                requestAnimationFrame(() => r(undefined)),
            )
        })
    }
}

describe('TransitionDirector — lifecycle arming', () => {
    test('after the transition primitive runs, entering cards are no longer hidden', async () => {
        const { container, getByTestId } = render(<Harness />)
        await act(async () => {
            await Promise.resolve()
        })

        await act(async () => {
            getByTestId('go-b').click()
        })
        // Drive enough RAFs for the transition primitive to step through
        // its activate path. anchorSlide / pourInDrop call activate on
        // first tick; the run-loop wraps each step in a RAF.
        await flushRafs(4)

        const cardB = container.querySelector(
            '[data-card-id="card-b"]',
        ) as HTMLElement
        expect(cardB).toBeTruthy()
        expect(cardB.style.visibility).not.toBe('hidden')
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
