import { useState, useEffect } from 'react'
import { PhysicsCard } from '../physics/PhysicsCard'
import { cardLayout, type CardSpec, type CardAnchor } from '../physics/CardLayout'

const CARD_W = 280
const CARD_H = 160

const CARD_SPECS: CardSpec[] = [
    {
        id: 'card-a',
        text: 'The quick brown fox jumps over the lazy dog.',
        fontKey: 'body',
        width: CARD_W,
        height: CARD_H,
    },
    {
        id: 'card-b',
        text: 'Pack my box with five dozen liquor jugs.',
        fontKey: 'body',
        width: CARD_W,
        height: CARD_H,
    },
]

function computeAnchors(): CardAnchor[] {
    const vp = { width: window.innerWidth, height: window.innerHeight }
    return cardLayout(CARD_SPECS, vp, () => ({ width: 0, height: 0 }))
}

export default function Home() {
    const [anchors, setAnchors] = useState<CardAnchor[]>([])

    useEffect(() => {
        setAnchors(computeAnchors())
        const onResize = () => setAnchors(computeAnchors())
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return (
        <>
            {anchors.map((anchor) => {
                const spec = CARD_SPECS.find((s) => s.id === anchor.id)!
                return (
                    <PhysicsCard
                        key={anchor.id}
                        text={spec.text}
                        anchor={{ x: anchor.x, y: anchor.y }}
                        width={anchor.width}
                        height={anchor.height}
                        minimizable
                        id={`home-${anchor.id}`}
                        label={anchor.id}
                        kind="home"
                    />
                )
            })}
        </>
    )
}
