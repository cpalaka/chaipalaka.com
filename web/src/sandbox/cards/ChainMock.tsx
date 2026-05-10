import { useEffect, useState } from 'react'
import { PhysicsCard } from '../../physics/PhysicsCard'
import type { CardInteractionMode } from '../../physics/PhysicsCard'
import type { SandboxConfig } from './state'
import { CardHeader } from './CardHeader'

interface ChainMockProps {
    config: SandboxConfig
}

const CARD_W = 220
const CARD_H = 100

function computeChainAnchors(): Array<{ x: number; y: number }> {
    const availableW = window.innerWidth - 220
    const startX = availableW * 0.68
    const startY = 160
    return [
        { x: startX, y: startY + CARD_H * 0.7 },
        { x: startX + 20, y: startY + CARD_H * 0.7 + CARD_H + 20 },
        { x: startX - 10, y: startY + CARD_H * 0.7 + (CARD_H + 20) * 2 },
    ]
}

const CHAIN_TEXTS = [
    'Parent note — daily entry. This card is the chain root.',
    '↳ Follow-on: second thought connected to the parent.',
    '↳ Follow-on: third thought in the chain sequence.',
]

export function ChainMock({ config: _config }: ChainMockProps) {
    const [anchors, setAnchors] = useState<Array<{ x: number; y: number }>>([])
    const [modes, setModes] = useState<CardInteractionMode[]>(['anchored', 'anchored', 'anchored'])

    useEffect(() => {
        setAnchors(computeChainAnchors())
        const onResize = () => setAnchors(computeChainAnchors())
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    if (anchors.length === 0) return null

    const setMode = (i: number) => (m: CardInteractionMode) =>
        setModes((prev) => {
            const next = [...prev] as CardInteractionMode[]
            next[i] = m
            return next
        })

    return (
        <>
            {CHAIN_TEXTS.map((text, i) => (
                <PhysicsCard
                    key={`anchored-chain-${i}`}
                    text={text}
                    fontKey="body"
                    maxWidth={CARD_W - 32}
                    anchor={anchors[i]!}
                    width={CARD_W}
                    height={CARD_H}
                    variant={i === 0 ? 'primary' : 'chain'}
                    interactionMode={modes[i]}
                    header={<CardHeader mode={modes[i]!} onChange={setMode(i)} />}
                />
            ))}
        </>
    )
}
