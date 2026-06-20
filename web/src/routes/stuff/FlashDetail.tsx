import { useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Page, type CardContent } from '../../card/Page'
import { getPieceBySlug } from '../../stuff/flash/pieces'
import { RuffleEmbed } from '../../stuff/flash/RuffleEmbed'
import type { PageDef } from '../PageDef'
import type { Piece } from '../../stuff/flash/pieces'
import type { Viewport } from '../../physics/PhysicsWorld'

const BACK_W = 220
const BACK_H = 56
const TITLE_W = 280
const TITLE_H = 96
const NOTES_W = 700
const NOTES_H = 100
const BACK_ANCHOR_Y = 120
const SPAWN_GAP = 24
const SWF_SCALE = 1.5
// .physics-card has box-sizing: border-box, padding: 24px, border: 4px,
// so each axis loses 56px to chrome. Add 16px of breathing room on each
// side of the player for visual margin.
const CARD_CHROME = 56
const SWF_PAD = 16

interface SpawnOffsets {
    back: number
    title: number
    swf: number
    notes: number
}

function randomOffset(): number {
    return (Math.random() * 2 - 1) * 50
}

// Stack card centers from `startY` downward, edge-to-edge with SPAWN_GAP between them.
function stackCenters(heights: number[], startY: number): number[] {
    const centers: number[] = []
    let cursor = startY
    for (const h of heights) {
        centers.push(cursor + h / 2)
        cursor += h + SPAWN_GAP
    }
    return centers
}

function buildPage(
    piece: Piece,
    offsets: SpawnOffsets,
): { pageDef: PageDef; cardContent: Record<string, CardContent> } {
    const playerW = Math.round(piece.frontmatter.swf_width * SWF_SCALE)
    const playerH = Math.round(piece.frontmatter.swf_height * SWF_SCALE)
    const swfW = playerW + CARD_CHROME + 2 * SWF_PAD
    const swfH = playerH + CARD_CHROME + 2 * SWF_PAD

    // Back card hangs from the ceiling at a fixed y; the other 3 are detached
    // and spawn stacked beneath it (edge-to-edge), then fall under gravity.
    const detachedStartY = BACK_ANCHOR_Y + BACK_H / 2 + SPAWN_GAP
    const [titleY, swfYy, notesY] = stackCenters(
        [TITLE_H, swfH, NOTES_H],
        detachedStartY,
    )

    const backAnchor = (vp: Viewport) => ({ x: vp.width / 2 + offsets.back, y: BACK_ANCHOR_Y })
    const titleAnchor = (vp: Viewport) => ({ x: vp.width / 2 + offsets.title, y: titleY! })
    const swfAnchor = (vp: Viewport) => ({ x: vp.width / 2 + offsets.swf, y: swfYy! })
    const notesAnchor = (vp: Viewport) => ({ x: vp.width / 2 + offsets.notes, y: notesY! })

    const pageDef: PageDef = {
        gravity: 'down',
        cards: [
            { id: 'flash-back', kind: 'link', parent: 'ceiling', anchor: backAnchor },
            { id: 'flash-title', kind: 'headline', parent: null, anchor: titleAnchor },
            { id: 'flash-swf', kind: 'portfolio', parent: null, anchor: swfAnchor },
            { id: 'flash-notes', kind: 'portfolio', parent: null, anchor: notesAnchor },
        ],
    }

    const Notes = piece.Component
    const cardContent: Record<string, CardContent> = {
        'flash-back': {
            text: '← Flash',
            width: BACK_W,
            height: BACK_H,
            draggable: false,
            children: (
                <Link
                    to="/stuff/flash"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        color: 'inherit',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                    }}
                >
                    ← Flash
                </Link>
            ),
        },
        'flash-title': {
            text: piece.frontmatter.title,
            width: TITLE_W,
            height: TITLE_H,
            draggable: false,
            children: (
                <div
                    style={{
                        margin: 'auto',
                        textAlign: 'center',
                    }}
                >
                    <h1 style={{ margin: 0, fontSize: '1.125rem' }}>
                        {piece.frontmatter.title}
                    </h1>
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
                </div>
            ),
        },
        'flash-swf': {
            text: piece.frontmatter.title,
            width: swfW,
            height: swfH,
            draggable: false,
            children: (
                <div style={{ margin: 'auto' }}>
                    <RuffleEmbed
                        swfUrl={`/assets/${piece.frontmatter.swf}`}
                        width={playerW}
                        height={playerH}
                    />
                </div>
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
            back: randomOffset(),
            title: randomOffset(),
            swf: randomOffset(),
            notes: randomOffset(),
        }),
        [slug],
    )

    const built = useMemo(
        () => (piece ? buildPage(piece, offsets) : null),
        [piece, offsets],
    )

    if (!piece || !built) {
        return <Navigate to="/stuff/flash" replace />
    }

    return <Page pageDef={built.pageDef} cardContent={built.cardContent} />
}
