import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { PeekProvider, usePeek } from './PeekContext'
import { PeekTriggers } from './PeekTriggers'
import type { PeekStore } from './PeekStore'

// matchMedia stub whose hover capability we control per test; everything else
// (prefers-reduced-motion, etc.) reports false.
function mockMatchMedia(hoverable: boolean) {
    vi.spyOn(window, 'matchMedia').mockImplementation(
        (q: string) =>
            ({
                matches: /hover: hover/.test(q) ? hoverable : false,
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

let store: PeekStore
function Capture() {
    store = usePeek()
    return null
}

function renderBox() {
    return render(
        <PhysicsProvider>
            <PeekProvider>
                <Capture />
                <div data-content-box="">
                    <div className="content-box__scroll">
                        <p>
                            Read{' '}
                            <a data-link-type="portal" href="/blog/hello-world">
                                the first post
                            </a>
                            .
                        </p>
                    </div>
                </div>
                <PeekTriggers />
            </PeekProvider>
        </PhysicsProvider>,
    )
}

function portalLink(): HTMLAnchorElement {
    return document.querySelector('a[data-link-type="portal"]')!
}

afterEach(() => vi.restoreAllMocks())

describe('PeekTriggers — desktop dwell', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('opens a portal preview after the dwell elapses', () => {
        mockMatchMedia(true)
        renderBox()
        fireEvent.pointerOver(portalLink(), { clientX: 100, clientY: 100 })
        expect(store.snapshot()).toHaveLength(0)
        vi.advanceTimersByTime(300)
        const entries = store.snapshot()
        expect(entries).toHaveLength(1)
        expect(entries[0]).toMatchObject({ kind: 'portal', phase: 'held' })
    })
})

describe('PeekTriggers — already-pinned word is inert (task-024)', () => {
    // A word that already has a pinned card must not re-peek: a fresh preview on
    // it can be kept again, double-pinning the same word (two tethers + nested
    // wobble spans). PinnedCard marks the source word with `pin-word`.
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('does NOT open a preview on dwell when the word is already pinned', () => {
        mockMatchMedia(true)
        renderBox()
        portalLink().classList.add('pin-word')
        fireEvent.pointerOver(portalLink(), { clientX: 100, clientY: 100 })
        vi.advanceTimersByTime(300)
        expect(store.snapshot()).toHaveLength(0)
    })

    it('does NOT open a preview on tap when the word is already pinned', () => {
        mockMatchMedia(false)
        renderBox()
        portalLink().classList.add('pin-word')
        fireEvent.pointerDown(portalLink())
        expect(store.snapshot()).toHaveLength(0)
    })
})

describe('PeekTriggers — mobile tap', () => {
    it('a tap on the link opens a preview (no hover/dwell)', () => {
        mockMatchMedia(false)
        renderBox()
        fireEvent.pointerDown(portalLink())
        const entries = store.snapshot()
        expect(entries).toHaveLength(1)
        expect(entries[0]).toMatchObject({ kind: 'portal', phase: 'held' })
    })

    it('a tap outside the card dismisses it', () => {
        mockMatchMedia(false)
        renderBox()
        fireEvent.pointerDown(portalLink())
        expect(store.snapshot()[0]?.phase).toBe('held')
        fireEvent.pointerDown(document.body)
        expect(store.snapshot()[0]?.phase).toBe('falling')
    })
})
