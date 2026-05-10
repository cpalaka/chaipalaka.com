import { useEffect, useState } from 'react'
import { PhysicsCard } from '../../physics/PhysicsCard'
import type { SandboxConfig } from './state'

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

    useEffect(() => {
        setAnchors(computeChainAnchors())
        const onResize = () => setAnchors(computeChainAnchors())
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    if (anchors.length === 0) return null

    return (
        <>
            <PhysicsCard
                key="chain-parent"
                text={CHAIN_TEXTS[0]!}
                fontKey="body"
                maxWidth={CARD_W - 32}
                anchor={anchors[0]!}
                width={CARD_W}
                height={CARD_H}
                variant="primary"
            />
            <PhysicsCard
                key="chain-1"
                text={CHAIN_TEXTS[1]!}
                fontKey="body"
                maxWidth={CARD_W - 32}
                anchor={anchors[1]!}
                width={CARD_W}
                height={CARD_H}
                variant="chain"
            />
            <PhysicsCard
                key="chain-2"
                text={CHAIN_TEXTS[2]!}
                fontKey="body"
                maxWidth={CARD_W - 32}
                anchor={anchors[2]!}
                width={CARD_W}
                height={CARD_H}
                variant="chain"
            />
        </>
    )
}
