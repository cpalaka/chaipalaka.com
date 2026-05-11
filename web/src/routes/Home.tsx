import { useState, useEffect } from 'react'
import { PhysicsCard } from '../physics/PhysicsCard'
import {
    cardLayout,
    type CardSpec,
    type CardAnchor,
} from '../physics/CardLayout'
import { registry as pretextRegistry } from '../text/registry'

const CARD_SPECS: CardSpec[] = [
    {
        id: 'hero',
        text: 'chaipalaka.com — personal site of Chai Palaka, frontend engineer and creative coder.',
        fontKey: 'body',
    },
    {
        id: 'about',
        text: 'Building interfaces at the intersection of craft and code. Physics-driven UI, generative art, and the web as a creative medium.',
        fontKey: 'body',
    },
    {
        id: 'blog',
        text: '/blog — writing on frontend architecture, creative coding, and the open web.',
        fontKey: 'body',
    },
    {
        id: 'portfolio',
        text: '/portfolio — Flash-era stick-figure animations and interactive experiments, playable in-browser.',
        fontKey: 'body',
    },
]

const CARD_LABELS: Record<string, string> = {
    hero: 'Home',
    about: 'About',
    blog: 'Blog',
    portfolio: 'Portfolio',
}

function computeAnchors(): CardAnchor[] {
    const vp = { width: window.innerWidth, height: window.innerHeight }
    return cardLayout(CARD_SPECS, vp, (text, fontKey, maxWidth) =>
        pretextRegistry.measure(text, fontKey, maxWidth),
    )
}

export default function Home() {
    // Anchors are computed client-side only: canvas text measurement is not
    // available in the SSR (Node.js) prerender environment.
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
                        label={CARD_LABELS[anchor.id] ?? anchor.id}
                        kind="home"
                    />
                )
            })}
        </>
    )
}
