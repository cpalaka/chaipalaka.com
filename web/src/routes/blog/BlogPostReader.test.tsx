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

// Changed in the task-044 review. This used to assert that an unknown slug
// rendered NOTHING — which was true, and was the bug: Caddy serves the 404
// shell and a 404 status at /blog/<typo>, but the client router resolves it to
// this component, so returning null left the content box empty. A mistyped
// post URL rendered a blank page. It now says what the bespoke 404 says.
describe('BlogPostReader — slug miss', () => {
    test('still renders the reading surface rather than nothing', () => {
        const { container } = renderAt('/blog/does-not-exist/read')
        expect(container.querySelector('main.reader')).toBeTruthy()
    })

    test('says the page does not exist', () => {
        const { getByText, container } = renderAt('/blog/does-not-exist/read')
        expect(container.textContent).toContain('404')
        expect(getByText(/doesn't exist/i)).toBeTruthy()
    })

    test('offers a way out', () => {
        const { container } = renderAt('/blog/does-not-exist/read')
        const hrefs = [...container.querySelectorAll('a')].map((a) =>
            a.getAttribute('href'),
        )
        expect(hrefs).toContain('/blog')
        expect(hrefs).toContain('/')
    })

    test('does not render post chrome it has no post for', () => {
        const { container } = renderAt('/blog/does-not-exist/read')
        expect(container.querySelector('.post-meta')).toBeNull()
        expect(container.querySelector('[data-testid="mdx-body"]')).toBeNull()
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
