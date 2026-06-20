import { describe, test, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

// Stub the MDX-backed posts module so the test runtime doesn't pull the
// real Vite MDX pipeline.
vi.mock('../../blog/posts', () => ({
    getPosts: () => [
        {
            slug: 'hello',
            frontmatter: {
                title: 'Hello World',
                description: 'd',
                date: '2026-05-09',
                tags: ['meta', 'intro'],
                draft: false,
            },
            toc: [],
            Component: () => <div data-testid="mdx-body">body</div>,
        },
        {
            slug: 'no-tags',
            frontmatter: {
                title: 'Untagged',
                description: 'd',
                date: '2026-04-01',
                tags: [],
                draft: false,
            },
            toc: [],
            Component: () => <div data-testid="mdx-body">body</div>,
        },
    ],
}))

import { PhysicsProvider } from '../../physics/PhysicsContext'
import { CardRegistryProvider } from '../../card/CardRegistry'
import { CardLayer } from '../../card/CardLayer'
import BlogPost from './BlogPost'

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <PhysicsProvider>
                <CardRegistryProvider>
                    <CardLayer />
                    <Routes>
                        <Route path="/blog/:slug" element={<BlogPost />} />
                    </Routes>
                </CardRegistryProvider>
            </PhysicsProvider>
        </MemoryRouter>,
    )
}

describe('BlogPost — slug miss', () => {
    test('returns null DOM when slug does not match any post', () => {
        const { container } = renderAt('/blog/does-not-exist')
        // No headline/title for an unknown slug — only the CardLayer wrapper.
        expect(container.querySelector('h1')).toBeNull()
    })
})

describe('BlogPost — slug match', () => {
    test('mounts without throwing', () => {
        expect(() => renderAt('/blog/hello')).not.toThrow()
    })

    test('renders <h1> with the frontmatter title', () => {
        const { container } = renderAt('/blog/hello')
        const h1 = container.querySelector('h1')
        expect(h1).toBeTruthy()
        expect(h1!.textContent).toBe('Hello World')
    })

    test('date is rendered via <time dateTime="..."> with the ISO date and long-format US date as text', () => {
        const { container } = renderAt('/blog/hello')
        const time = container.querySelector('time')
        expect(time).toBeTruthy()
        expect(time!.getAttribute('datetime')).toBe('2026-05-09')
        // The visible date depends on the runner's timezone (UTC midnight may
        // render as May 8 in PT). Assert month + year, not exact day-of-month.
        expect(time!.textContent).toMatch(/May \d{1,2}, 2026/)
    })

    test('tags are joined with ", " when present', () => {
        const { container } = renderAt('/blog/hello')
        expect(container.textContent).toContain('meta, intro')
    })

    test('tag dot-separator is absent when tags is empty', () => {
        const { container } = renderAt('/blog/no-tags')
        // The " · " separator only renders when tags are non-empty.
        const meta = container.querySelector('.post-meta')
        expect(meta).toBeTruthy()
        expect(meta!.textContent ?? '').not.toContain('·')
    })

    test('"Read in plain mode" link points to /blog/{slug}/read', () => {
        const { container } = renderAt('/blog/hello')
        const plainLink = container.querySelector('a.plain-mode-link')
        expect(plainLink).toBeTruthy()
        expect(plainLink!.getAttribute('href')).toBe('/blog/hello/read')
    })

    test('renders the stubbed MDX body component', () => {
        // BlogPost gates the body render behind a window-resize effect; flush it.
        // jsdom/happy-dom dispatch resize synchronously, so this is enough.
        let utils: ReturnType<typeof renderAt>
        act(() => {
            utils = renderAt('/blog/hello')
        })
        expect(utils!.queryByTestId('mdx-body')).toBeTruthy()
    })
})
