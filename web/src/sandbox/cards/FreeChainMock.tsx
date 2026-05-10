import { useEffect, useRef, useState } from 'react'
import { PhysicsCard } from '../../physics/PhysicsCard'
import { usePhysicsWorld } from '../../physics/PhysicsContext'
import type { PhysicsHandle, LinkHandle } from '../../physics/PhysicsWorld'
import type { SandboxConfig } from './state'
import { CardHeader } from './CardHeader'

interface FreeChainMockProps {
    config: SandboxConfig
}

const CARD_W = 220
const CARD_H = 100
const CHAIN_GAP = 30
const STRING_STIFFNESS = 0.04
const STRING_DAMPING = 0.12

function computePositions(): Array<{ x: number; y: number }> {
    const startX = 240
    const startY = 200
    return [
        { x: startX, y: startY },
        { x: startX + 20, y: startY + CARD_H + CHAIN_GAP },
        { x: startX - 15, y: startY + (CARD_H + CHAIN_GAP) * 2 },
    ]
}

const CHAIN_TEXTS = [
    'Free chain — parent. Drag me; the others follow on a string.',
    '↳ Follow-on: moves with parent, can be dragged independently.',
    '↳ Follow-on: last node in the free-hanging chain.',
]

type InteractionMode = 'anchored' | 'locked' | 'free'

export function FreeChainMock({ config: _config }: FreeChainMockProps) {
    const world = usePhysicsWorld()
    const [positions, setPositions] = useState<Array<{ x: number; y: number }>>([])
    const [modes, setModes] = useState<InteractionMode[]>(['free', 'free', 'free'])

    const handleRefs = useRef<Array<React.MutableRefObject<PhysicsHandle | null>>>(
        [{ current: null }, { current: null }, { current: null }],
    )
    const linkRefs = useRef<LinkHandle[]>([])

    useEffect(() => {
        setPositions(computePositions())
    }, [])

    // Link bodies after all three are registered.
    useEffect(() => {
        if (positions.length === 0) return
        const [h0, h1, h2] = handleRefs.current

        const linkInterval = setInterval(() => {
            if (h0!.current === null || h1!.current === null || h2!.current === null) return
            clearInterval(linkInterval)

            const link01 = world.linkBodies(h0!.current, h1!.current, {
                stiffness: STRING_STIFFNESS,
                damping: STRING_DAMPING,
            })
            const link12 = world.linkBodies(h1!.current, h2!.current, {
                stiffness: STRING_STIFFNESS,
                damping: STRING_DAMPING,
            })
            linkRefs.current = [link01, link12]
        }, 30)

        return () => {
            clearInterval(linkInterval)
            for (const link of linkRefs.current) {
                world.unlinkBodies(link)
            }
            linkRefs.current = []
        }
    }, [world, positions])

    if (positions.length === 0) return null

    return (
        <>
            {CHAIN_TEXTS.map((text, i) => (
                <PhysicsCard
                    key={`free-chain-${i}`}
                    text={text}
                    fontKey="body"
                    maxWidth={CARD_W - 32}
                    anchor={positions[i]!}
                    width={CARD_W}
                    height={CARD_H}
                    variant={i === 0 ? 'primary' : 'chain'}
                    interactionMode={modes[i]}
                    physicsHandleRef={handleRefs.current[i]}
                    header={
                        <CardHeader
                            mode={modes[i]!}
                            onChange={(m) =>
                                setModes((prev) => {
                                    const next = [...prev] as InteractionMode[]
                                    next[i] = m
                                    return next
                                })
                            }
                        />
                    }
                />
            ))}
        </>
    )
}
