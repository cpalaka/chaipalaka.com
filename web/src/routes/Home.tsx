import { useState, useEffect } from 'react'
import { PhysicsCard } from '../physics/PhysicsCard'
import { cardLayout, type CardSpec, type CardAnchor } from '../physics/CardLayout'
import { registry as pretextRegistry } from '../text/registry'

const CARD_SPECS: CardSpec[] = [
    {
        id: 'card-a',
        text: 'The quick brown fox jumps over the lazy dog.',
        fontKey: 'body',
    },
    {
        id: 'card-b',
        text: 'Pack my box with five dozen liquor jugs.',
        fontKey: 'body',
    },
]

function computeAnchors(): CardAnchor[] {
    const vp = { width: window.innerWidth, height: window.innerHeight }
    return cardLayout(CARD_SPECS, vp, (text, fontKey, maxWidth) =>
        pretextRegistry.measure(text, fontKey, maxWidth),
    )
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
                        fontKey={spec.fontKey}
                        maxWidth={anchor.maxWidth}
                        anchor={{ x: anchor.x, y: anchor.y }}
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
