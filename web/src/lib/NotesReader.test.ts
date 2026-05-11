import { describe, test, expect } from 'vitest'
import {
    deriveNoteSlug,
    validateNoteFrontmatter,
    filterAndSortNotes,
} from './NotesReader'
import type { Note } from './NotesReader'

describe('deriveNoteSlug', () => {
    test('strips date prefix and returns slug from path', () => {
        expect(
            deriveNoteSlug('../../../content/notes/2026-05-08-on-strings.mdx'),
        ).toBe('on-strings')
    })

    test('handles multi-word slug', () => {
        expect(
            deriveNoteSlug(
                '../../../content/notes/2026-01-15-reading-and-thinking.mdx',
            ),
        ).toBe('reading-and-thinking')
    })
})

describe('validateNoteFrontmatter', () => {
    test('accepts valid frontmatter with parent', () => {
        const fm = validateNoteFrontmatter({
            date: '2026-05-08',
            parent: 'lifelog:books',
        })
        expect(fm.date).toBe('2026-05-08')
        expect(fm.parent).toBe('lifelog:books')
    })

    test('accepts valid frontmatter with null parent', () => {
        const fm = validateNoteFrontmatter({ date: '2026-05-08', parent: null })
        expect(fm.parent).toBeNull()
    })

    test('throws on missing date', () => {
        expect(() => validateNoteFrontmatter({ parent: null })).toThrow()
    })
})

describe('filterAndSortNotes', () => {
    const notes: Note[] = [
        {
            slug: 'b',
            frontmatter: { date: '2026-03-01', parent: 'lifelog:books' },
            body: 'b',
        },
        {
            slug: 'a',
            frontmatter: { date: '2026-05-08', parent: 'lifelog:books' },
            body: 'a',
        },
        {
            slug: 'c',
            frontmatter: { date: '2026-04-10', parent: null },
            body: 'c',
        },
    ]

    test('sorts newest-first by default', () => {
        const sorted = filterAndSortNotes(notes)
        expect(sorted.map((n) => n.slug)).toEqual(['a', 'c', 'b'])
    })

    test('filters by parent when provided', () => {
        const filtered = filterAndSortNotes(notes, {
            parent: 'lifelog:books',
        })
        expect(filtered.map((n) => n.slug)).toEqual(['a', 'b'])
    })

    test('returns only standalone notes when parent is null', () => {
        const filtered = filterAndSortNotes(notes, { parent: null })
        expect(filtered.map((n) => n.slug)).toEqual(['c'])
    })
})
