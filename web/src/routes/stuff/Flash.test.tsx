import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Piece } from '../../stuff/flash/pieces'

vi.mock('../../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

// Stub the pieces module so the test runtime doesn't pull the real MDX
// pipeline. Flash.tsx imports getPiecesByCategory eagerly at module scope.
vi.mock('../../stuff/flash/pieces', () => ({
    getPiecesByCategory: () => new Map<string, Piece[]>(),
    getPieceBySlug: () => undefined,
}))

import Flash, { buildFlashIndex } from './Flash'
import { PhysicsProvider } from '../../physics/PhysicsContext'
import { CardRegistryProvider } from '../../card/CardRegistry'
import { PhysicsLayer } from '../../card/CardLayer'

const CHAIN_TOP = 100
const HEADER_H = 140
const PIECE_H = 320
const CHAIN_GAP = 60

function makePiece(slug: string, title = slug): Piece {
    return {
        slug,
        frontmatter: {
            title,
            description: '',
            category: 'unused',
            quality: 5,
            thumbnail: 't.png',
            swf: 's.swf',
            swf_width: 320,
            swf_height: 240,
            tags: [],
            draft: false,
        },
        Component: () => null,
    }
}

describe('buildFlashIndex — empty input', () => {
    test('empty map → empty pageDef and empty cardContent', () => {
        const { pageDef, cardContent } = buildFlashIndex(new Map(), {
            width: 1024,
            height: 768,
        })
        expect(pageDef.gravity).toBe('down')
        expect(pageDef.cards).toEqual([])
        expect(cardContent).toEqual({})
    })
})

describe('buildFlashIndex — sorted categories + chain topology', () => {
    test('category keys are sorted alphabetically', () => {
        const groups = new Map<string, Piece[]>([
            ['zebra', [makePiece('z1')]],
            ['alpha', [makePiece('a1')]],
        ])
        const { pageDef } = buildFlashIndex(groups, {
            width: 1024,
            height: 768,
        })
        const headers = pageDef.cards.filter((c) => c.kind === 'headline')
        expect(headers.map((h) => h.id)).toEqual([
            'flash-cat-alpha',
            'flash-cat-zebra',
        ])
    })

    test('first card per category is the header (headline, parent=ceiling)', () => {
        const groups = new Map<string, Piece[]>([
            ['shorts', [makePiece('a'), makePiece('b')]],
        ])
        const { pageDef } = buildFlashIndex(groups, {
            width: 1024,
            height: 768,
        })
        const header = pageDef.cards.find((c) => c.id === 'flash-cat-shorts')!
        expect(header.kind).toBe('headline')
        expect(header.parent).toBe('ceiling')
    })

    test('piece cards are flash-piece-{slug}, portfolio kind, parented in chain order', () => {
        const groups = new Map<string, Piece[]>([
            ['shorts', [makePiece('a'), makePiece('b'), makePiece('c')]],
        ])
        const { pageDef } = buildFlashIndex(groups, {
            width: 1024,
            height: 768,
        })
        // chain: header → a → b → c
        const a = pageDef.cards.find((c) => c.id === 'flash-piece-a')!
        const b = pageDef.cards.find((c) => c.id === 'flash-piece-b')!
        const c = pageDef.cards.find((c) => c.id === 'flash-piece-c')!
        expect(a.kind).toBe('portfolio')
        expect(b.kind).toBe('portfolio')
        expect(c.kind).toBe('portfolio')
        expect(a.parent).toBe('flash-cat-shorts')
        expect(b.parent).toBe('flash-piece-a')
        expect(c.parent).toBe('flash-piece-b')
    })
})

describe('buildFlashIndex — anchor math', () => {
    test('header x = width * (i+1)/(N+1); y = CHAIN_TOP + HEADER_H/2', () => {
        const groups = new Map<string, Piece[]>([
            ['alpha', [makePiece('a1')]],
            ['beta', [makePiece('b1')]],
            ['gamma', [makePiece('c1')]],
        ])
        const vp = { width: 1200, height: 800 }
        const { pageDef } = buildFlashIndex(groups, vp)
        const headers = pageDef.cards.filter((c) => c.kind === 'headline')
        expect(headers).toHaveLength(3)
        headers.forEach((h, i) => {
            const { x, y } = h.anchor(vp)
            expect(x).toBeCloseTo((vp.width * (i + 1)) / 4, 5)
            expect(y).toBeCloseTo(CHAIN_TOP + HEADER_H / 2, 5)
        })
    })

    test('piece y increments by PIECE_H + CHAIN_GAP per step; piece x matches header x', () => {
        const groups = new Map<string, Piece[]>([
            ['alpha', [makePiece('a'), makePiece('b')]],
        ])
        const vp = { width: 1200, height: 800 }
        const { pageDef } = buildFlashIndex(groups, vp)
        const header = pageDef.cards.find((c) => c.id === 'flash-cat-alpha')!
        const a = pageDef.cards.find((c) => c.id === 'flash-piece-a')!
        const b = pageDef.cards.find((c) => c.id === 'flash-piece-b')!
        const aPos = a.anchor(vp)
        const bPos = b.anchor(vp)
        const headerPos = header.anchor(vp)

        // Pieces share x with their header.
        expect(aPos.x).toBeCloseTo(headerPos.x, 5)
        expect(bPos.x).toBeCloseTo(headerPos.x, 5)

        // First piece sits one full PIECE_H + CHAIN_GAP below the header centre
        // (header bottom edge + GAP + half a piece).
        const expectedAY =
            CHAIN_TOP + HEADER_H + CHAIN_GAP + PIECE_H / 2
        expect(aPos.y).toBeCloseTo(expectedAY, 5)
        expect(bPos.y - aPos.y).toBeCloseTo(PIECE_H + CHAIN_GAP, 5)
    })
})

describe('Flash — default export render', () => {
    test('mounts without throwing under MemoryRouter', () => {
        expect(() =>
            render(
                <MemoryRouter initialEntries={['/stuff/flash']}>
                    <PhysicsProvider>
                        <CardRegistryProvider>
                            <PhysicsLayer />
                            <Flash />
                        </CardRegistryProvider>
                    </PhysicsProvider>
                </MemoryRouter>,
            ),
        ).not.toThrow()
    })
})
