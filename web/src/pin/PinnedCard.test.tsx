import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { PinnedCard } from './PinnedCard'
import type { PinEntry } from './PinStore'

afterEach(cleanup)

function makeWord(text = 'source word'): HTMLAnchorElement {
    const a = document.createElement('a')
    a.setAttribute('data-link-type', 'portal')
    a.href = '/blog/hello'
    a.textContent = text
    document.body.appendChild(a)
    return a
}

function renderPin(entry: PinEntry) {
    return render(
        <PhysicsProvider>
            <PinnedCard entry={entry} />
        </PhysicsProvider>,
    )
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
