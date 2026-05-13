import { useEffect, useState } from 'react'
import { PhysicsCard } from '../../physics/PhysicsCard'
import { HiddenScroll } from './HiddenScroll'
import { CardHeader } from './CardHeader'

interface PlaygroundProps {
    minimized: boolean
    onMinimize: () => void
}

const DEFAULT_W = 320
const DEFAULT_H = 220

function computeAnchor(): { x: number; y: number } {
    const availableW = window.innerWidth
    const availableH = window.innerHeight - 120
    return {
        x: availableW * 0.38,
        y: 120 + availableH * 0.45,
    }
}

const LOREM =
    'Type specimen — the quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow. Now is the time for bold decisions.'

export function Playground({ minimized, onMinimize }: PlaygroundProps) {
    const [anchor, setAnchor] = useState<{ x: number; y: number }>(() =>
        typeof window !== 'undefined' ? computeAnchor() : { x: 400, y: 350 },
    )
    const [cardSize] = useState({ width: DEFAULT_W, height: DEFAULT_H })

    useEffect(() => {
        const onResize = () => setAnchor(computeAnchor())
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    if (minimized) return null

    return (
        <PhysicsCard
            id="playground-card"
            text={LOREM}
            anchor={anchor}
            width={cardSize.width}
            height={cardSize.height}
            variant="playground"
            header={<CardHeader onMinimize={onMinimize} />}
        >
            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    minHeight: 0,
                }}
            >
                <HiddenScroll style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9em' }}>
                        Playground
                    </p>
                    <p style={{ margin: '6px 0 0' }}>{LOREM}</p>
                    <p style={{ margin: '6px 0 0', opacity: 0.55 }}>{LOREM}</p>
                </HiddenScroll>
            </div>
        </PhysicsCard>
    )
}
