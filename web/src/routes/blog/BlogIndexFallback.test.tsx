import { describe, test, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { BlogIndexFallback } from './BlogIndexFallback'
import type { Post } from '../../blog/types'

function post(
    over: Partial<Post['frontmatter']> & { slug?: string } = {},
): Post {
    const { slug = 'hello-world', ...fm } = over
    return {
        slug,
        frontmatter: {
            title: 'Hello World',
            description: 'A first post.',
            date: '2026-05-09',
            tags: [],
            draft: false,
            ...fm,
        },
        toc: [],
        Component: () => null,
    }
}

describe('BlogIndexFallback', () => {
    test('renders one list entry per post', () => {
        render(
            <BlogIndexFallback
                posts={[
                    post({ slug: 'a', title: 'A' }),
                    post({ slug: 'b', title: 'B' }),
                ]}
            />,
        )
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    test('links each post to its plain-mode reader, which prerenders without JS', () => {
        render(<BlogIndexFallback posts={[post({ slug: 'my-post' })]} />)
        const link = screen.getByRole('link', { name: /hello world/i })
        expect(link).toHaveAttribute('href', '/blog/my-post/read')
    })

    test('shows the title, description and a human date', () => {
        render(
            <BlogIndexFallback
                posts={[
                    post({
                        title: 'Deep Dive',
                        description: 'On physics cards.',
                        date: '2026-05-09',
                    }),
                ]}
            />,
        )
        expect(screen.getByText('Deep Dive')).toBeInTheDocument()
        expect(screen.getByText('On physics cards.')).toBeInTheDocument()
        expect(screen.getByText('May 9, 2026')).toBeInTheDocument()
    })

    test('renders tags when present and omits the line when empty', () => {
        const { rerender } = render(
            <BlogIndexFallback posts={[post({ tags: ['react', 'ssr'] })]} />,
        )
        expect(screen.getByText('react · ssr')).toBeInTheDocument()

        rerender(<BlogIndexFallback posts={[post({ tags: [] })]} />)
        const item = screen.getByRole('listitem')
        expect(within(item).queryByText('·', { exact: false })).toBeNull()
    })
})
