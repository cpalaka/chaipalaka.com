import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

// Stub the blog posts module so NotFound's `getPosts().slice(0, 3)` is
// deterministic and doesn't depend on the real MDX pipeline.
vi.mock('../blog/posts', () => ({
    getPosts: () => [
        {
            slug: 'post-one',
            frontmatter: {
                title: 'Post One',
                description: 'd',
                date: '2026-05-01',
                tags: [],
                draft: false,
            },
            toc: [],
            Component: () => null,
        },
        {
            slug: 'post-two',
            frontmatter: {
                title: 'Post Two',
                description: 'd',
                date: '2026-04-01',
                tags: [],
                draft: false,
            },
            toc: [],
            Component: () => null,
        },
    ],
}))

import NotFound, { pageDef } from './NotFound'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { CardRegistryProvider } from '../card/CardRegistry'
import { CardLayer } from '../card/CardLayer'

function renderNotFound() {
    return render(
        <MemoryRouter initialEntries={['/bogus']}>
            <PhysicsProvider>
                <CardRegistryProvider>
                    <CardLayer />
                    <NotFound />
                </CardRegistryProvider>
            </PhysicsProvider>
        </MemoryRouter>,
    )
}

describe('NotFound — pageDef shape', () => {
    test('gravity is up', () => {
        expect(pageDef.gravity).toBe('up')
    })

    test('has at least 3 cards (headline + portfolio + link), up to 3 more from recent posts', () => {
        expect(pageDef.cards.length).toBeGreaterThanOrEqual(3)
        expect(pageDef.cards.length).toBeLessThanOrEqual(6)
        const ids = pageDef.cards.map((c) => c.id)
        expect(ids).toContain('notfound-headline')
        expect(ids).toContain('notfound-portfolio')
        expect(ids).toContain('notfound-link')
    })
})

describe('NotFound — render', () => {
    test('mounts without throwing', () => {
        expect(() => renderNotFound()).not.toThrow()
    })

    test('renders <h1>404</h1> and the page-not-found copy', () => {
        const { container, getByText } = renderNotFound()
        const h1 = container.querySelector('h1')
        expect(h1).toBeTruthy()
        expect(h1!.textContent).toBe('404')
        expect(getByText(/doesn't exist/i)).toBeTruthy()
    })

    test('renders a link to /stuff and a link to /', () => {
        const { container } = renderNotFound()
        expect(container.querySelector('a[href="/stuff"]')).toBeTruthy()
        expect(container.querySelector('a[href="/"]')).toBeTruthy()
    })
})
