import { useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { PhysicsPage, type CardContent } from '../../physics/PhysicsPage'
import { getPieceBySlug } from '../../stuff/flash/pieces'
import { getCategoryMeta } from '../../stuff/flash/categories'
import { RuffleEmbed } from '../../stuff/flash/RuffleEmbed'
import type { PageDef } from '../../physics/PageDef'
import type { Piece } from '../../stuff/flash/pieces'
import type { Viewport } from '../../physics/PhysicsWorld'

const TITLE_W = 280
const TITLE_H = 120
const NOTES_W = 400
const NOTES_H = 360
const STACK_Y_OFFSET = 100

interface SpawnOffsets {
    title: number
    swf: number
    notes: number
}

function randomOffset(): number {
    return (Math.random() * 2 - 1) * 50
}

function buildPage(
    piece: Piece,
    offsets: SpawnOffsets,
): { pageDef: PageDef; cardContent: Record<string, CardContent> } {
    const swfW = piece.frontmatter.swf_width + 32
    const swfH = piece.frontmatter.swf_height + 64
    const meta = getCategoryMeta(piece.frontmatter.category)

    const titleAnchor = (vp: Viewport) => ({
        x: vp.width / 2 + offsets.title,
        y: vp.height * 0.2,
    })
    const swfAnchor = (vp: Viewport) => ({
        x: vp.width / 2 + offsets.swf,
        y: vp.height * 0.2 + STACK_Y_OFFSET,
    })
    const notesAnchor = (vp: Viewport) => ({
        x: vp.width / 2 + offsets.notes,
        y: vp.height * 0.2 + STACK_Y_OFFSET * 2,
    })

    const pageDef: PageDef = {
        gravity: 'down',
        cards: [
            { id: 'flash-title', kind: 'headline', parent: null, anchor: titleAnchor },
            { id: 'flash-swf', kind: 'portfolio', parent: null, anchor: swfAnchor },
            { id: 'flash-notes', kind: 'note', parent: null, anchor: notesAnchor },
        ],
    }

    const Notes = piece.Component
    const cardContent: Record<string, CardContent> = {
        'flash-title': {
            text: piece.frontmatter.title,
            width: TITLE_W,
            height: TITLE_H,
            draggable: false,
            children: (
                <>
                    <h1 style={{ margin: 0, fontSize: '1.125rem' }}>
                        {piece.frontmatter.title}
                    </h1>
                    <Link to="/stuff/flash" style={{ fontSize: '0.875rem' }}>
                        ← {meta.label}
                    </Link>
                    {piece.frontmatter.tags.length > 0 && (
                        <p
                            style={{
                                margin: '0.25rem 0 0',
                                fontSize: '0.75rem',
                                opacity: 0.7,
                            }}
                        >
                            {piece.frontmatter.tags.join(' · ')}
                        </p>
                    )}
                </>
            ),
        },
        'flash-swf': {
            text: piece.frontmatter.title,
            width: swfW,
            height: swfH,
            draggable: false,
            children: (
                <RuffleEmbed
                    swfUrl={`/assets/${piece.frontmatter.swf}`}
                    width={piece.frontmatter.swf_width}
                    height={piece.frontmatter.swf_height}
                />
            ),
        },
        'flash-notes': {
            text: 'Notes',
            width: NOTES_W,
            height: NOTES_H,
            draggable: false,
            children: (
                <div
                    style={{
                        overflowY: 'auto',
                        height: '100%',
                        paddingRight: 8,
                    }}
                >
                    <Notes />
                </div>
            ),
        },
    }

    return { pageDef, cardContent }
}

export default function FlashDetail() {
    const { slug } = useParams<{ slug: string }>()
    const piece = slug ? getPieceBySlug(slug) : undefined

    const offsets = useMemo<SpawnOffsets>(
        () => ({
            title: randomOffset(),
            swf: randomOffset(),
            notes: randomOffset(),
        }),
        [slug],
    )

    if (!piece) {
        return <Navigate to="/stuff/flash" replace />
    }

    const { pageDef, cardContent } = buildPage(piece, offsets)
    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
