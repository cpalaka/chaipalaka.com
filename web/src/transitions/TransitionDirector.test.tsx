import { describe, test, expect, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { TransitionDirector } from './TransitionDirector'
import { PhysicsLayer } from './PhysicsLayer'
import { PageDefRegistryProvider } from './PageDefRegistry'
import { PhysicsCard } from '../physics/PhysicsCard'
import type { PageDef } from '../routes/PageDef'

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

// Mimics BlogIndex: starts with zero cards, populates a chain in useEffect.
function RouteBlogLike() {
    const [chain, setChain] = useState<
        Array<{ id: string; parent: string | null }>
    >([])
    useEffect(() => {
        setChain([
            { id: 'chain-1', parent: 'ceiling' },
            { id: 'chain-2', parent: 'chain-1' },
            { id: 'chain-3', parent: 'chain-2' },
        ])
    }, [])
    return (
        <>
            {chain.map((card, i) => (
                <PhysicsCard
                    key={card.id}
                    id={card.id}
                    text={`chain ${i}`}
                    width={200}
                    height={100}
                    anchor={{ x: 200, y: 100 + i * 150 }}
                    parent={card.parent ?? undefined}
                />
            ))}
        </>
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
                        <NavigateButton to="/blog" label="go-blog" />
                        <Routes>
                            <Route path="/a" element={<RouteA />} />
                            <Route path="/b" element={<RouteB />} />
                            <Route path="/blog" element={<RouteBlogLike />} />
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
    test('chain cards mount + auto-activate when no transition is in flight', async () => {
        // Render harness starting directly at /blog so no transition fires.
        // Cards register unarmed → microtask → activate.
        function BlogHarness() {
            return (
                <MemoryRouter initialEntries={['/blog']}>
                    <PhysicsProvider>
                        <PageDefRegistryProvider>
                            <TransitionDirector pageDefs={pageDefs}>
                                <PhysicsLayer />
                                <Routes>
                                    <Route path="/blog" element={<RouteBlogLike />} />
                                </Routes>
                            </TransitionDirector>
                        </PageDefRegistryProvider>
                    </PhysicsProvider>
                </MemoryRouter>
            )
        }
        const { container } = render(<BlogHarness />)
        await act(async () => {
            await Promise.resolve()
        })
        await flushRafs(2)

        for (const id of ['chain-1', 'chain-2', 'chain-3']) {
            const el = container.querySelector(
                `[data-card-id="${id}"]`,
            ) as HTMLElement | null
            expect(el, `card ${id} should be in DOM`).toBeTruthy()
            expect(
                el?.style.visibility,
                `card ${id} should not be visibility:hidden`,
            ).not.toBe('hidden')
        }
    })

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
