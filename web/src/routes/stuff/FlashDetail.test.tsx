import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import type { PageDef } from '../PageDef'
import type { Piece } from '../../stuff/flash/pieces'
import type { CardContent } from '../../card/Page'

vi.mock('../../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

// Mock the Ruffle embed so the test doesn't pull a real script into the
// happy-dom runtime.
vi.mock('../../stuff/flash/RuffleEmbed', () => ({
    RuffleEmbed: () => <div data-testid="ruffle-stub" />,
}))

// Capture the props Page was rendered with — this is the cleanest way
// to assert per-card props (draggable, etc.) without driving the full physics
// pipeline.
const physicsPageCalls: Array<{
    pageDef: PageDef
    cardContent: Record<string, CardContent>
}> = []
vi.mock('../../card/Page', async () => {
    const mod = await vi.importActual<
        typeof import('../../card/Page')
    >('../../card/Page')
    return {
        ...mod,
        Page: (props: {
            pageDef: PageDef
            cardContent: Record<string, CardContent>
        }) => {
            physicsPageCalls.push(props)
            return <div data-testid="physics-page-stub" />
        },
    }
})

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

// Changed in the task-044 review. This used to redirect to /stuff/flash, which
// meant a mistyped piece URL landed the visitor on a 200-looking gallery under
// a 404 response, with the URL they typed silently discarded. The route is
// under CanvasLayout, the same shell NotFound renders in, so it now shows the
// bespoke 404 in place.
describe('FlashDetail — slug miss', () => {
    test('does NOT redirect away from the URL that was requested', () => {
        const { getLocation, queryByTestId } = renderAt('/stuff/flash/missing')
        expect(getLocation()).toBe('/stuff/flash/missing')
        expect(queryByTestId('flash-index')).toBeNull()
    })

    test('renders the bespoke 404 in place', () => {
        renderAt('/stuff/flash/missing')
        const notFound = physicsPageCalls.at(-1)
        expect(notFound).toBeDefined()
        expect(notFound!.pageDef.cards.map((c) => c.id)).toContain(
            'notfound-headline',
        )
        expect(notFound!.cardContent['notfound-headline']!.text).toContain('404')
    })

    // The complement — that a KNOWN slug still renders the piece rather than
    // the 404 — is the "FlashDetail — slug match" describe below, which mocks
    // getPieceBySlug to resolve. Duplicating it here would only re-assert the
    // miss path, since this block has no piece registered.
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
