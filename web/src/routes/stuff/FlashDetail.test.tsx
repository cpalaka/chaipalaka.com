import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import type { PageDef } from '../PageDef'
import type { Piece } from '../../stuff/flash/pieces'
import type { CardContent } from '../../physics/PhysicsPage'

vi.mock('../../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

// Mock the Ruffle embed so the test doesn't pull a real script into the
// happy-dom runtime.
vi.mock('../../stuff/flash/RuffleEmbed', () => ({
    RuffleEmbed: () => <div data-testid="ruffle-stub" />,
}))

// Capture the props PhysicsPage was rendered with — this is the cleanest way
// to assert per-card props (draggable, etc.) without driving the full physics
// pipeline.
const physicsPageCalls: Array<{
    pageDef: PageDef
    cardContent: Record<string, CardContent>
}> = []
vi.mock('../../physics/PhysicsPage', async () => {
    const mod = await vi.importActual<
        typeof import('../../physics/PhysicsPage')
    >('../../physics/PhysicsPage')
    return {
        ...mod,
        PhysicsPage: (props: {
            pageDef: PageDef
            cardContent: Record<string, CardContent>
        }) => {
            physicsPageCalls.push(props)
            return <div data-testid="physics-page-stub" />
        },
    }
})

const registered: { def: PageDef | null } = { def: null }
vi.mock('../../transitions/PageDefRegistry', () => ({
    useRegisterPageDef: (def: PageDef) => {
        registered.def = def
    },
}))

const piecesByCategory = new Map<string, Piece[]>()
const piecesBySlug = new Map<string, Piece>()
vi.mock('../../stuff/flash/pieces', () => ({
    getPiecesByCategory: () => piecesByCategory,
    getPieceBySlug: (slug: string) => piecesBySlug.get(slug),
}))

import FlashDetail from './FlashDetail'

function makePiece(slug: string): Piece {
    return {
        slug,
        frontmatter: {
            title: `Title ${slug}`,
            description: 'd',
            category: 'shorts',
            quality: 7,
            thumbnail: 't.png',
            swf: `${slug}.swf`,
            swf_width: 320,
            swf_height: 240,
            tags: ['flash', 'demo'],
            draft: false,
        },
        Component: () => <div data-testid="notes-body">notes</div>,
    }
}

function renderAt(path: string) {
    physicsPageCalls.length = 0
    registered.def = null
    let location = ''
    function LocationProbe() {
        location = useLocation().pathname
        return null
    }
    const utils = render(
        <MemoryRouter initialEntries={[path]}>
            <LocationProbe />
            <Routes>
                <Route path="/stuff/flash/:slug" element={<FlashDetail />} />
                <Route path="/stuff/flash" element={<div data-testid="flash-index" />} />
            </Routes>
        </MemoryRouter>,
    )
    return { ...utils, getLocation: () => location }
}

describe('FlashDetail — slug miss', () => {
    test('renders <Navigate> to /stuff/flash (router lands on the index route)', () => {
        const { getLocation, queryByTestId } = renderAt('/stuff/flash/missing')
        expect(getLocation()).toBe('/stuff/flash')
        // The fallback index route was rendered.
        expect(queryByTestId('flash-index')).toBeTruthy()
    })
})

describe('FlashDetail — slug match', () => {
    const slug = 'demo-piece'

    function setup() {
        piecesBySlug.clear()
        piecesBySlug.set(slug, makePiece(slug))
        return renderAt(`/stuff/flash/${slug}`)
    }

    test('mounts without throwing', () => {
        expect(() => setup()).not.toThrow()
    })

    test('builds a PageDef with exactly 4 cards: flash-back, flash-title, flash-swf, flash-notes', () => {
        setup()
        expect(physicsPageCalls).toHaveLength(1)
        const def = physicsPageCalls[0]!.pageDef
        const ids = def.cards.map((c) => c.id)
        expect(ids).toEqual([
            'flash-back',
            'flash-title',
            'flash-swf',
            'flash-notes',
        ])
    })

    test('card kinds and parents match the spec', () => {
        setup()
        const def = physicsPageCalls[0]!.pageDef
        const back = def.cards.find((c) => c.id === 'flash-back')!
        const title = def.cards.find((c) => c.id === 'flash-title')!
        const swf = def.cards.find((c) => c.id === 'flash-swf')!
        const notes = def.cards.find((c) => c.id === 'flash-notes')!
        expect(back.kind).toBe('link')
        expect(back.parent).toBe('ceiling')
        expect(title.kind).toBe('headline')
        expect(title.parent).toBeNull()
        expect(swf.kind).toBe('portfolio')
        expect(swf.parent).toBeNull()
        expect(notes.kind).toBe('portfolio')
        expect(notes.parent).toBeNull()
    })

    test('all 4 cards have draggable=false in cardContent', () => {
        setup()
        const content = physicsPageCalls[0]!.cardContent
        for (const id of ['flash-back', 'flash-title', 'flash-swf', 'flash-notes']) {
            expect(content[id]).toBeTruthy()
            expect(content[id]!.draggable).toBe(false)
        }
    })

    test('useRegisterPageDef is invoked with the built pageDef', () => {
        setup()
        expect(registered.def).not.toBeNull()
        // The same object passed to PhysicsPage is the one registered.
        expect(registered.def).toBe(physicsPageCalls[0]!.pageDef)
    })

    test('flash-back children contain a Link to /stuff/flash with "← Flash" text', () => {
        setup()
        const back = physicsPageCalls[0]!.cardContent['flash-back']!
        // Render the children subtree under a router so the Link resolves.
        const { container } = render(
            <MemoryRouter>{back.children as React.ReactNode}</MemoryRouter>,
        )
        const link = container.querySelector('a[href="/stuff/flash"]')
        expect(link).toBeTruthy()
        expect(link!.textContent).toMatch(/← Flash/)
    })
})
