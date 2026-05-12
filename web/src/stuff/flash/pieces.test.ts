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
        title: 'Bouncy Ball',
        description: 'A ball bouncing.',
        category: 'tests',
        quality: 7,
        thumbnail: 'stuff/flash/bouncy-ball.png',
        swf: 'stuff/flash/bouncy-ball.swf',
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

    it('rejects non-integer quality', () => {
        expect(() =>
            validatePieceFrontmatter({ ...valid, quality: 5.5 }),
        ).toThrow()
    })

    it('rejects quality below 1', () => {
        expect(() =>
            validatePieceFrontmatter({ ...valid, quality: 0 }),
        ).toThrow()
    })

    it('rejects quality above 10', () => {
        expect(() =>
            validatePieceFrontmatter({ ...valid, quality: 11 }),
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
        quality: number,
        draft = false,
    ): Piece => ({
        slug,
        frontmatter: {
            title: slug,
            description: '',
            category,
            quality,
            thumbnail: `stuff/flash/${slug}.png`,
            swf: `stuff/flash/${slug}.swf`,
            swf_width: 550,
            swf_height: 400,
            tags: [],
            draft,
        },
        Component: () => null,
    })

    it('groups pieces by category and sorts by quality desc', () => {
        const pieces = [
            makePiece('low', 'shorts', 3),
            makePiece('high', 'shorts', 9),
            makePiece('test-1', 'tests', 5),
        ]
        const groups = filterAndGroup(pieces, false)
        expect(groups.get('shorts')?.map((p) => p.slug)).toEqual([
            'high',
            'low',
        ])
        expect(groups.get('tests')?.map((p) => p.slug)).toEqual([
            'test-1',
        ])
    })

    it('breaks quality ties by slug ascending', () => {
        const pieces = [
            makePiece('zeta', 'shorts', 7),
            makePiece('alpha', 'shorts', 7),
            makePiece('mu', 'shorts', 7),
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
            makePiece('pub', 'shorts', 8),
            makePiece('wip', 'shorts', 9, true),
        ]
        const groups = filterAndGroup(pieces, true)
        expect(groups.get('shorts')?.map((p) => p.slug)).toEqual(['pub'])
    })

    it('keeps drafts outside production', () => {
        const pieces = [
            makePiece('pub', 'shorts', 8),
            makePiece('wip', 'shorts', 9, true),
        ]
        const groups = filterAndGroup(pieces, false)
        expect(groups.get('shorts')?.length).toBe(2)
    })

    it('returns an empty Map for empty input', () => {
        expect(filterAndGroup([], false).size).toBe(0)
    })
})
