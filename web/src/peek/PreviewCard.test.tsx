import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { PeekProvider } from './PeekContext'
import { PreviewCard } from './PreviewCard'
import type { PreviewEntry } from './PeekStore'

function renderCard(entry: PreviewEntry) {
    return render(
        <PhysicsProvider>
            <PeekProvider>
                <PreviewCard entry={entry} />
            </PeekProvider>
        </PhysicsProvider>,
    )
}

const base = {
    phase: 'held' as const,
    center: { x: 200, y: 200 },
    side: 'right' as const,
    width: 300,
}

describe('PreviewCard (held)', () => {
    it('renders a Portal preview: title bar + a lead link to the destination', () => {
        renderCard({
            ...base,
            id: 'p1',
            sourceId: 'a',
            kind: 'portal',
            title: 'Hello, World',
            lead: 'The first post.',
            href: '/blog/hello-world',
        })
        expect(screen.getByText('Hello, World')).toBeInTheDocument()
        const link = screen.getByRole('link', { name: 'The first post.' })
        expect(link).toHaveAttribute('href', '/blog/hello-world')
    })

    it('renders a Pocket preview: the lifted note body', () => {
        renderCard({
            ...base,
            id: 'k1',
            sourceId: '1',
            kind: 'pocket',
            title: 'Note',
            bodyHtml: '<p>The whole note.</p>',
        })
        expect(screen.getByText('The whole note.')).toBeInTheDocument()
    })
})
