import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import BlogIndex from './BlogIndex'
import { getPosts } from '../../blog/posts'

describe('BlogIndex — v2 quiet content-box listing', () => {
    test('renders every post title as a Portal link to its /blog/:slug', () => {
        const { container } = render(<BlogIndex />)
        const portals = Array.from(
            container.querySelectorAll('a[data-link-type="portal"]'),
        ).map((a) => a.getAttribute('href'))
        const expected = getPosts().map((p) => `/blog/${p.slug}`)
        expect(portals).toHaveLength(expected.length)
        expect(portals).toEqual(expect.arrayContaining(expected))
    })

    test('lists posts in reverse-chronological order', () => {
        const { container } = render(<BlogIndex />)
        const dates = Array.from(
            container.querySelectorAll('time.blog-list__date'),
        ).map((t) => +new Date(t.getAttribute('dateTime') ?? ''))
        const sorted = [...dates].sort((a, b) => b - a)
        expect(dates).toEqual(sorted)
    })

    test('renders the "Writing" heading', () => {
        const { container } = render(<BlogIndex />)
        expect(container.querySelector('h1')?.textContent).toBe('Writing')
    })
})
