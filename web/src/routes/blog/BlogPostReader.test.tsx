import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Stub posts so the test runtime doesn't pull the real Vite MDX pipeline.
// BlogPostReader exercises a non-empty TOC; include one entry.
vi.mock('../../blog/posts', () => ({
    getPosts: () => [
        {
            slug: 'hello',
            frontmatter: {
                title: 'Hello World',
                description: 'd',
                date: '2026-05-09',
                tags: ['meta'],
                draft: false,
            },
            toc: [{ depth: 2, text: 'Section', slug: 'section' }],
            Component: () => <div data-testid="mdx-body">body</div>,
        },
    ],
}))

import BlogPostReader from './BlogPostReader'

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/blog/:slug/read" element={<BlogPostReader />} />
            </Routes>
        </MemoryRouter>,
    )
}

describe('BlogPostReader — slug miss', () => {
    test('returns null when slug does not match any post', () => {
        const { container } = renderAt('/blog/does-not-exist/read')
        // The router renders an empty wrapper around a null route element.
        expect(container.querySelector('main.reader')).toBeNull()
    })
})

describe('BlogPostReader — slug match', () => {
    test('mounts without throwing', () => {
        expect(() => renderAt('/blog/hello/read')).not.toThrow()
    })

    test('renders <main class="reader"> wrapper', () => {
        const { container } = renderAt('/blog/hello/read')
        expect(container.querySelector('main.reader')).toBeTruthy()
    })

    test('renders <nav class="reader__toc"> with one <li data-depth="2"> per TOC entry', () => {
        const { container } = renderAt('/blog/hello/read')
        const nav = container.querySelector('nav.reader__toc')
        expect(nav).toBeTruthy()
        const items = nav!.querySelectorAll('li')
        expect(items).toHaveLength(1)
        expect(items[0]!.getAttribute('data-depth')).toBe('2')
        const anchor = items[0]!.querySelector('a')
        expect(anchor!.getAttribute('href')).toBe('#section')
    })

    test('article body renders <h1> with the frontmatter title', () => {
        const { container } = renderAt('/blog/hello/read')
        const h1 = container.querySelector('article.reader__body h1')
        expect(h1).toBeTruthy()
        expect(h1!.textContent).toBe('Hello World')
    })

    test('article body renders <time dateTime="..."> with the ISO date', () => {
        const { container } = renderAt('/blog/hello/read')
        const time = container.querySelector('article.reader__body time')
        expect(time).toBeTruthy()
        expect(time!.getAttribute('datetime')).toBe('2026-05-09')
    })

    test('article body renders the stubbed MDX body component', () => {
        const { queryByTestId } = renderAt('/blog/hello/read')
        expect(queryByTestId('mdx-body')).toBeTruthy()
    })
})
