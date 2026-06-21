import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PhysicsProvider, usePhysicsWorld } from '../physics/PhysicsContext'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import { PinnedCard } from './PinnedCard'
import { PinLayer } from './PinLayer'
import { PinProvider, usePin } from './PinContext'
import type { PinStore, PinEntry, PinSpec } from './PinStore'

afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
})

function makeWord(text = 'source word'): HTMLAnchorElement {
    const a = document.createElement('a')
    a.setAttribute('data-link-type', 'portal')
    a.href = '/blog/hello'
    a.textContent = text
    document.body.appendChild(a)
    return a
}

function renderPin(entry: PinEntry) {
    // useViewTransitionState (via useMorphSource in PinnedCard) needs a data
    // router — the same kind vite-react-ssg uses in prod. PinnedCard reads the
    // PinStore (to carry its subtree on scroll), so it needs a PinProvider.
    const router = createMemoryRouter(
        [
            {
                path: '/',
                element: (
                    <PhysicsProvider>
                        <PinProvider>
                            <PinnedCard entry={entry} />
                        </PinProvider>
                    </PhysicsProvider>
                ),
            },
        ],
        { initialEntries: ['/'] },
    )
    return render(<RouterProvider router={router} />)
}

const base = {
    center: { x: 300, y: 300 },
    width: 300,
    height: 160,
}

describe('PinnedCard', () => {
    it('renders a Portal pinned card: title bar + lead link to the destination', () => {
        const sourceEl = makeWord()
        renderPin({
            ...base,
            id: 'pin-0',
            sourceEl,
            kind: 'portal',
            title: 'Hello',
            lead: 'The first post.',
            href: '/blog/hello',
        })
        expect(screen.getByText('Hello')).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'The first post.' }),
        ).toHaveAttribute('href', '/blog/hello')
    })

    it('renders an External pinned card: link-text title, note, hostname source, safe new-tab link (task-029)', () => {
        const sourceEl = makeWord('src-term')
        renderPin({
            ...base,
            id: 'pin-ext',
            sourceEl,
            kind: 'external',
            title: 'Gwern Branwen',
            lead: 'the reading-craft note',
            href: 'https://gwern.net',
            source: 'gwern.net',
        })
        expect(screen.getByText('Gwern Branwen')).toBeInTheDocument()
        expect(screen.getByText('the reading-craft note')).toBeInTheDocument()
        expect(screen.getByText('gwern.net')).toBeInTheDocument()
        const link = screen.getByRole('link', { name: /reading-craft note/ })
        expect(link).toHaveAttribute('href', 'https://gwern.net')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('wraps the source word in a transform-only span and marks it bonded, leaving text intact', () => {
        const sourceEl = makeWord('anchored term')
        renderPin({
            ...base,
            id: 'pin-1',
            sourceEl,
            kind: 'portal',
            title: 'T',
            href: '/blog/hello',
        })
        const span = sourceEl.querySelector('.pin-wobble')
        expect(span).not.toBeNull()
        expect(sourceEl.classList.contains('pin-word')).toBe(true)
        // The real text is preserved (selection/copy/SR see unchanged text).
        expect(sourceEl.textContent).toBe('anchored term')
    })

    it('unwraps the source word and clears its marker on unmount', () => {
        const sourceEl = makeWord('term')
        const { unmount } = renderPin({
            ...base,
            id: 'pin-2',
            sourceEl,
            kind: 'pocket',
            bodyHtml: '<p>note</p>',
        })
        expect(sourceEl.querySelector('.pin-wobble')).not.toBeNull()
        unmount()
        expect(sourceEl.querySelector('.pin-wobble')).toBeNull()
        expect(sourceEl.classList.contains('pin-word')).toBe(false)
        expect(sourceEl.textContent).toBe('term')
    })
})

// --- Recursion (task-027): a child pin ropes to its parent card ---------------

function mockReduced(on: boolean) {
    vi.spyOn(window, 'matchMedia').mockImplementation(
        (q: string) =>
            ({
                matches: /prefers-reduced-motion/.test(q) ? on : false,
                media: q,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
                dispatchEvent: vi.fn(),
                onchange: null,
            }) as unknown as MediaQueryList,
    )
}

function rect(left: number, top: number, width = 40, height = 16): DOMRect {
    return {
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
    } as DOMRect
}

let captured: { world: PhysicsWorld; store: PinStore }
function Capture() {
    captured = { world: usePhysicsWorld(), store: usePin() }
    return null
}

// Drive the real store + PinLayer so parent and child PinnedCards share one
// PhysicsWorld (the topology under test). Returns the captured world + store.
function renderTree() {
    const router = createMemoryRouter(
        [
            {
                path: '/',
                element: (
                    <PhysicsProvider>
                        <PinProvider>
                            <Capture />
                            <PinLayer />
                        </PinProvider>
                    </PhysicsProvider>
                ),
            },
        ],
        { initialEntries: ['/'] },
    )
    render(<RouterProvider router={router} />)
    return captured
}

const parentSpec = (sourceEl: Element): PinSpec => ({
    sourceEl,
    kind: 'pocket',
    center: { x: 300, y: 300 },
    width: 300,
    height: 160,
    bodyHtml: '<p>note</p>',
})

const childSpec = (sourceEl: Element, parentId: string): PinSpec => ({
    sourceEl,
    kind: 'portal',
    center: { x: 300, y: 480 },
    width: 200,
    height: 120,
    parentId,
    href: '/blog/hello',
    title: 'Child',
    lead: 'a child lead',
})

describe('PinnedCard — child pin (recursion)', () => {
    it('ropes the child card to its PARENT card (a card-to-card tether), not a word', () => {
        const { world, store } = renderTree()
        const word = makeWord('parent word')
        const link = makeWord('child link')
        let pid = ''
        let cid = ''
        act(() => {
            pid = store.pin(parentSpec(word))
            cid = store.pin(childSpec(link, pid))
        })
        const ph = world.getHandleById(pid)!
        const ch = world.getHandleById(cid)!
        const roped = world.tether
            .records()
            .some((r) => r.parent === ph && r.child === ch)
        expect(roped).toBe(true)
    })

    it('marks the child source link bonded and does NOT wrap it in a wobble span (no word regime)', () => {
        const { store } = renderTree()
        const word = makeWord('parent word')
        const link = makeWord('child link')
        act(() => {
            const pid = store.pin(parentSpec(word))
            store.pin(childSpec(link, pid))
        })
        expect(link.classList.contains('pin-word')).toBe(true)
        expect(link.querySelector('.pin-wobble')).toBeNull()
        const childCard = document.querySelector('[data-pin-parent]')
        expect(childCard?.getAttribute('data-pin-parent')).toBeTruthy()
    })

    it('carries the child by the same scroll delta as the parent (spike G5)', () => {
        mockReduced(true) // freeze bodies so only the translate-pair moves them
        const { world, store } = renderTree()
        const word = makeWord('parent word')
        const link = makeWord('child link')
        word.getBoundingClientRect = vi.fn(() => rect(100, 100))
        let pid = ''
        let cid = ''
        act(() => {
            pid = store.pin(parentSpec(word))
            cid = store.pin(childSpec(link, pid))
        })
        const ph = world.getHandleById(pid)!
        const ch = world.getHandleById(cid)!
        const p0 = world.getPosition(ph)
        const c0 = world.getPosition(ch)
        // Scroll the parent's source word up 40px, then tick once.
        word.getBoundingClientRect = vi.fn(() => rect(100, 60))
        act(() => world.tick(16))
        const p1 = world.getPosition(ph)
        const c1 = world.getPosition(ch)
        expect(p1.y - p0.y).toBeCloseTo(-40, 1) // parent carried by the delta
        expect(c1.y - c0.y).toBeCloseTo(-40, 1) // child carried by the SAME delta
    })
})
