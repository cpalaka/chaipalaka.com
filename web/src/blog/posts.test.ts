import { describe, it, expect } from 'vitest'
import { deriveSlug, validateFrontmatter, filterAndSort } from './posts'
import type { Post } from './types'

describe('deriveSlug', () => {
    it('strips date prefix from glob key path', () => {
        expect(
            deriveSlug(
                '../../../content/blog/2026-05-09-hello-world/index.mdx',
            ),
        ).toBe('hello-world')
    })

    it('handles a slug with no extra hyphens', () => {
        expect(
            deriveSlug('../../../content/blog/2026-01-01-intro/index.mdx'),
        ).toBe('intro')
    })

    it('strips only the leading YYYY-MM-DD- prefix', () => {
        expect(
            deriveSlug(
                '../../../content/blog/2025-12-31-my-year-in-review/index.mdx',
            ),
        ).toBe('my-year-in-review')
    })
})

describe('validateFrontmatter', () => {
    const valid = {
        title: 'Hello World',
        description: 'A test post.',
        date: '2026-05-09',
        tags: ['meta'],
    }

    it('accepts valid frontmatter and fills in draft default', () => {
        const result = validateFrontmatter(valid)
        expect(result.draft).toBe(false)
        expect(result.og_image).toBeUndefined()
    })

    it('accepts frontmatter with draft and og_image', () => {
        const result = validateFrontmatter({
            ...valid,
            draft: true,
            og_image: './cover.png',
        })
        expect(result.draft).toBe(true)
        expect(result.og_image).toBe('./cover.png')
    })

    it('throws when title is missing', () => {
        const { title: _, ...noTitle } = valid
        expect(() => validateFrontmatter(noTitle)).toThrow()
    })

    it('throws when description is missing', () => {
        const { description: _, ...noDesc } = valid
        expect(() => validateFrontmatter(noDesc)).toThrow()
    })

    it('throws when date is not ISO 8601 format', () => {
        expect(() =>
            validateFrontmatter({ ...valid, date: 'May 9 2026' }),
        ).toThrow()
    })

    it('throws when tags is not an array', () => {
        expect(() => validateFrontmatter({ ...valid, tags: 'meta' })).toThrow()
    })
})

describe('filterAndSort', () => {
    const makePost = (slug: string, date: string, draft = false): Post => ({
        slug,
        frontmatter: { title: slug, description: '', date, tags: [], draft },
        toc: [],
        Component: () => null,
    })

    it('sorts posts reverse-chronologically', () => {
        const posts = [
            makePost('jan', '2026-01-15'),
            makePost('jun', '2026-06-01'),
            makePost('mar', '2026-03-20'),
        ]
        const sorted = filterAndSort(posts, false)
        expect(sorted.map((p) => p.slug)).toEqual(['jun', 'mar', 'jan'])
    })

    it('excludes draft posts in production', () => {
        const posts = [
            makePost('pub', '2026-01-01'),
            makePost('wip', '2026-02-01', true),
        ]
        const result = filterAndSort(posts, true)
        expect(result.map((p) => p.slug)).toEqual(['pub'])
    })

    it('includes draft posts outside production', () => {
        const posts = [
            makePost('pub', '2026-01-01'),
            makePost('wip', '2026-02-01', true),
        ]
        expect(filterAndSort(posts, false)).toHaveLength(2)
    })

    it('returns empty array for empty input', () => {
        expect(filterAndSort([], true)).toEqual([])
    })
})
