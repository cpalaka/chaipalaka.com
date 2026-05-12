import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsPage, type CardContent } from '../../physics/PhysicsPage'
import { getPiecesByCategory } from '../../stuff/flash/pieces'
import { getCategoryMeta } from '../../stuff/flash/categories'
import type { PageDef, CardSpec } from '../../physics/PageDef'
import type { Viewport } from '../../physics/PhysicsWorld'

const CHAIN_TOP = 100
const HEADER_W = 280
const HEADER_H = 140
const PIECE_W = 360
const PIECE_H = 320
const CHAIN_GAP = 60

const groupsAtImport = getPiecesByCategory()

export function buildFlashIndex(
    groups: Map<string, ReturnType<typeof getPiecesByCategory> extends Map<string, infer V> ? V : never>,
    vp: Viewport,
): { pageDef: PageDef; cardContent: Record<string, CardContent> } {
    const categoryKeys = Array.from(groups.keys()).sort()
    const cards: CardSpec[] = []
    const cardContent: Record<string, CardContent> = {}

    const chainCount = categoryKeys.length
    categoryKeys.forEach((catKey, ci) => {
        const meta = getCategoryMeta(catKey)
        const pieces = groups.get(catKey)!
        const xFraction = chainCount === 0 ? 0.5 : (ci + 1) / (chainCount + 1)

        const headerId = `flash-cat-${catKey}`
        cards.push({
            id: headerId,
            kind: 'headline',
            parent: 'ceiling',
            anchor: (viewport: Viewport) => ({
                x: viewport.width * xFraction,
                y: CHAIN_TOP + HEADER_H / 2,
            }),
        })
        cardContent[headerId] = {
            text: meta.label,
            width: HEADER_W,
            height: HEADER_H,
            children: (
                <>
                    <h2>{meta.label}</h2>
                    {meta.description ? <p>{meta.description}</p> : null}
                </>
            ),
        }

        let y = CHAIN_TOP + HEADER_H + CHAIN_GAP + PIECE_H / 2
        let parentId = headerId
        for (const piece of pieces) {
            const id = `flash-piece-${piece.slug}`
            const yCaptured = y
            cards.push({
                id,
                kind: 'portfolio',
                parent: parentId,
                anchor: (viewport: Viewport) => ({
                    x: viewport.width * xFraction,
                    y: yCaptured,
                }),
            })
            cardContent[id] = {
                text: piece.frontmatter.title,
                width: PIECE_W,
                height: PIECE_H,
                children: (
                    <Link
                        to={`/stuff/flash/${piece.slug}`}
                        style={{
                            display: 'block',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        <img
                            src={`/assets/${piece.frontmatter.thumbnail}`}
                            alt={piece.frontmatter.title}
                            width={320}
                            height={240}
                            loading="lazy"
                            style={{
                                display: 'block',
                                width: 320,
                                height: 240,
                                objectFit: 'cover',
                                marginBottom: 8,
                            }}
                        />
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>
                            {piece.frontmatter.title}
                        </h3>
                    </Link>
                ),
            }
            parentId = id
            y += PIECE_H + CHAIN_GAP
        }
        void vp
    })

    return { pageDef: { gravity: 'down', cards }, cardContent }
}

function getViewport(): Viewport {
    return typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1024, height: 768 }
}

const empty: { pageDef: PageDef; cardContent: Record<string, CardContent> } = {
    pageDef: { gravity: 'down', cards: [] },
    cardContent: {},
}

export default function Flash() {
    const [page, setPage] = useState(empty)

    useEffect(() => {
        function update() {
            setPage(buildFlashIndex(groupsAtImport, getViewport()))
        }
        update()
        window.addEventListener('resize', update, { passive: true })
        return () => window.removeEventListener('resize', update)
    }, [])

    return <PhysicsPage pageDef={page.pageDef} cardContent={page.cardContent} />
}
