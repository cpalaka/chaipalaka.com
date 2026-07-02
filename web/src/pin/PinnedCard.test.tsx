import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PhysicsProvider, usePhysicsWorld } from '../physics/PhysicsContext'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import { PinnedCard } from './PinnedCard'
import { PinLayer } from './PinLayer'
import { PinProvider, usePin } from './PinContext'
import { edgeAttachPoint } from '../physics/Tether'
import { pinTuning } from './pinTuning'
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

// --- Word wobble regime guard (task-036) -------------------------------------
// Only an actively word-anchored card drives its source word's wobble. Once a
// card auto-parks to a box edge it no longer tracks the word, so the word must
// settle to neutral — the bug was the wobble running every tick regardless of
// regime, so a parked card kept jiggling its word.

describe('PinnedCard — word wobble regime guard (task-036)', () => {
    function wobbleOffset(span: HTMLElement): number {
        const m = span.style.transform.match(
            /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/,
        )
        return m ? Math.hypot(parseFloat(m[1] ?? '0'), parseFloat(m[2] ?? '0')) : 0
    }

    it('a parked card does NOT drive its word wobble (only word-anchored cards wobble)', () => {
        const { world, store } = renderTree()
        // Content box: a DOM rect for the fold + its registered physics edges.
        const box = document.createElement('div')
        box.setAttribute('data-content-box', '')
        box.getBoundingClientRect = vi.fn(() => rect(0, 200, 600, 200)) // fold 200..400
        document.body.appendChild(box)
        act(() => world.setContentBox({ x: 0, y: 200, width: 600, height: 200 }))

        const word = makeWord('anchor')
        word.getBoundingClientRect = vi.fn(() => rect(100, 250)) // centre ~258, in fold
        let id = ''
        act(() => {
            id = store.pin(parentSpec(word))
        })
        const ch = world.getHandleById(id)!
        const span = word.querySelector('.pin-wobble') as HTMLElement
        expect(span).not.toBeNull()

        // Scroll the word well above the fold → the card auto-parks to the top edge.
        word.getBoundingClientRect = vi.fn(() => rect(100, 20)) // centre ~28 << fold.top
        act(() => world.tick(16))

        // Drive a strong card velocity every frame; a PARKED card must not move its
        // word wobble span (pre-fix it tracked the card's velocity and kept jiggling).
        act(() => {
            for (let i = 0; i < 40; i++) {
                world.setVelocity(ch, { x: 200, y: 0 })
                world.tick(16)
            }
        })

        expect(wobbleOffset(span)).toBeLessThan(0.5)
    })
})

// --- Radial edge wiring on auto-park (task-042.01, spec §3.3) ----------------
// parkAt used to inline-duplicate the old y-projection edge wiring; it now calls
// the shared edgeAttachPoint (the radial rule). Driving a REAL auto-park with the
// card OUT of the edge's width proves the clamp+radial geometry at this 2nd site
// (Tether.test.ts covers wireTetherFor, the 1st site).
describe('PinnedCard — radial edge wiring on auto-park (task-042.01)', () => {
    it('auto-park wires the edge rope with the radial rule (attach point + radial length)', () => {
        const { world, store } = renderTree()
        // Box off to the side of the card's spawn x (300): x∈[400,600], fold y∈[200,400].
        const box = document.createElement('div')
        box.setAttribute('data-content-box', '')
        box.getBoundingClientRect = vi.fn(() => rect(400, 200, 200, 200))
        document.body.appendChild(box)
        act(() => world.setContentBox({ x: 400, y: 200, width: 200, height: 200 }))

        const word = makeWord('anchor')
        word.getBoundingClientRect = vi.fn(() => rect(300, 250)) // in fold
        let id = ''
        act(() => {
            id = store.pin(parentSpec(word))
        })
        const ch = world.getHandleById(id)!
        const top = world.contentBoxTopHandle!

        // Scroll the word above the fold → auto-park to the top edge in one tick.
        word.getBoundingClientRect = vi.fn(() => rect(300, 20))
        act(() => world.tick(16))

        const rec = world.tether
            .records()
            .find((r) => r.parent === top && r.child === ch)
        expect(rec).toBeDefined()
        const expected = edgeAttachPoint(world, top, world.getPosition(ch))

        // Attach point = radial nearest edge point, clamped to the bar (x=400) —
        // NOT the card's own x (~300) as the old inline y-projection produced.
        const pbp = world.getPosition(top)
        expect(pbp.x + rec!.anchorA!.x).toBeCloseTo(400, 0)
        expect(pbp.y + rec!.anchorA!.y).toBeCloseTo(200, 0)
        expect(rec!.anchorA!.x).toBeCloseTo(expected.anchorA.x, 6)
        expect(rec!.anchorA!.y).toBeCloseTo(expected.anchorA.y, 6)

        // Radial length: seeded at the radial distance, then eased toward parkRest
        // — so the recorded length is in (parkRest, radial].
        const parkRest = 160 / 2 + pinTuning.parkGapPx
        expect(expected.length).toBeGreaterThan(parkRest)
        expect(rec!.length).toBeGreaterThan(parkRest)
        expect(rec!.length).toBeLessThanOrEqual(expected.length + 1e-6)
    })
})
