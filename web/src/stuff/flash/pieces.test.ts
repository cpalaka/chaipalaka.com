import { describe, it, expect } from 'vitest'
import {
    derivePieceSlug,
    validatePieceFrontmatter,
    filterAndGroup,
    type Piece,
} from './pieces'

describe('derivePieceSlug', () => {
    it('takes the parent directory name as the slug', () => {
        expect(
            derivePieceSlug(
                '../../../content/stuff/flash/stick-fight/index.mdx',
            ),
        ).toBe('stick-fight')
    })

    it('does not strip date prefixes (slug = dir name verbatim)', () => {
        expect(
            derivePieceSlug(
                '../../../content/stuff/flash/2005-old-bouncy/index.mdx',
            ),
        ).toBe('2005-old-bouncy')
    })
})

describe('validatePieceFrontmatter', () => {
    const valid = {
        title: 'Stick Fight',
        description: 'Two stickmen, one room.',
        category: 'stick-figures',
        order: 1,
        thumbnail: 'stuff/flash/stick-fight.png',
        swf: 'stuff/flash/stick-fight.swf',
        swf_width: 550,
        swf_height: 400,
    }

    it('accepts valid frontmatter with defaults filled in', () => {
        const result = validatePieceFrontmatter(valid)
        expect(result.tags).toEqual([])
        expect(result.draft).toBe(false)
    })

    it('accepts custom tags + draft', () => {
        const result = validatePieceFrontmatter({
            ...valid,
            tags: ['violence', 'comedy'],
            draft: true,
        })
        expect(result.tags).toEqual(['violence', 'comedy'])
        expect(result.draft).toBe(true)
    })

    it('rejects missing title', () => {
        const { title: _, ...noTitle } = valid
        expect(() => validatePieceFrontmatter(noTitle)).toThrow()
    })

    it('rejects missing category', () => {
        const { category: _, ...noCat } = valid
        expect(() => validatePieceFrontmatter(noCat)).toThrow()
    })

    it('rejects non-integer order', () => {
        expect(() =>
            validatePieceFrontmatter({ ...valid, order: 1.5 }),
        ).toThrow()
    })

    it('rejects non-positive swf_width', () => {
        expect(() =>
            validatePieceFrontmatter({ ...valid, swf_width: 0 }),
        ).toThrow()
    })

    it('rejects missing swf path', () => {
        const { swf: _, ...noSwf } = valid
        expect(() => validatePieceFrontmatter(noSwf)).toThrow()
    })
})

describe('filterAndGroup', () => {
    const makePiece = (
        slug: string,
        category: string,
        order: number,
        draft = false,
    ): Piece => ({
        slug,
        frontmatter: {
            title: slug,
            description: '',
            category,
            order,
            thumbnail: `stuff/flash/${slug}.png`,
            swf: `stuff/flash/${slug}.swf`,
            swf_width: 550,
            swf_height: 400,
            tags: [],
            draft,
        },
        Component: () => null,
    })

    it('groups pieces by category and sorts by order asc', () => {
        const pieces = [
            makePiece('b-piece', 'shorts', 2),
            makePiece('a-piece', 'shorts', 1),
            makePiece('stick-1', 'stick-figures', 1),
        ]
        const groups = filterAndGroup(pieces, false)
        expect(groups.get('shorts')?.map((p) => p.slug)).toEqual([
            'a-piece',
            'b-piece',
        ])
        expect(groups.get('stick-figures')?.map((p) => p.slug)).toEqual([
            'stick-1',
        ])
    })

    it('breaks order ties by slug ascending', () => {
        const pieces = [
            makePiece('zeta', 'shorts', 1),
            makePiece('alpha', 'shorts', 1),
            makePiece('mu', 'shorts', 1),
        ]
        const groups = filterAndGroup(pieces, false)
        expect(groups.get('shorts')?.map((p) => p.slug)).toEqual([
            'alpha',
            'mu',
            'zeta',
        ])
    })

    it('filters drafts in production', () => {
        const pieces = [
            makePiece('pub', 'shorts', 1),
            makePiece('wip', 'shorts', 2, true),
        ]
        const groups = filterAndGroup(pieces, true)
        expect(groups.get('shorts')?.map((p) => p.slug)).toEqual(['pub'])
    })

    it('keeps drafts outside production', () => {
        const pieces = [
            makePiece('pub', 'shorts', 1),
            makePiece('wip', 'shorts', 2, true),
        ]
        const groups = filterAndGroup(pieces, false)
        expect(groups.get('shorts')?.length).toBe(2)
    })

    it('returns an empty Map for empty input', () => {
        expect(filterAndGroup([], false).size).toBe(0)
    })
})
