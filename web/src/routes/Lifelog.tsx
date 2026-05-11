// TODO: /portfolio cards will opt in to minimizable once issue #20 ships.
import { useState, useEffect } from 'react'
import { PhysicsCard } from '../physics/PhysicsCard'
import { cardLayout, type CardAnchor } from '../physics/CardLayout'
import './Lifelog.css'

const BOOKS_CARD_HEIGHT = 200
const BOOKS_CARD_MAX_WIDTH = 360
const GUTTER = 16

function computeBookAnchor(): CardAnchor {
    const vp = { width: window.innerWidth, height: window.innerHeight }
    const numCols = vp.width >= 1024 ? 3 : vp.width >= 480 ? 2 : 1
    const colWidth = vp.width / numCols
    const w = Math.min(BOOKS_CARD_MAX_WIDTH, colWidth - GUTTER * 2)
    const anchors = cardLayout(
        [
            {
                id: 'books',
                text: 'Books',
                fontKey: 'body',
                width: w,
                height: BOOKS_CARD_HEIGHT,
            },
        ],
        vp,
        () => ({ width: 0, height: 0 }),
    )
    return (
        anchors[0] ?? {
            id: 'books',
            x: vp.width / 2,
            y: BOOKS_CARD_HEIGHT / 2 + 80,
            width: w,
            height: BOOKS_CARD_HEIGHT,
            maxWidth: w,
        }
    )
}

export default function Lifelog() {
    const [anchor, setAnchor] = useState<CardAnchor | null>(null)

    useEffect(() => {
        setAnchor(computeBookAnchor())
        const onResize = () => setAnchor(computeBookAnchor())
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    if (!anchor) return null

    return (
        <PhysicsCard
            text="Books"
            anchor={{ x: anchor.x, y: anchor.y }}
            width={anchor.width}
            height={anchor.height}
            minimizable
            id="lifelog-books"
            label="Books"
            kind="lifelog"
        >
            <div className="lifelog-books">
                <h2 className="lifelog-books__heading">Books</h2>
                <p className="lifelog-books__empty">—</p>
            </div>
        </PhysicsCard>
    )
}
