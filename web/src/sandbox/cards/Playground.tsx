import { useEffect, useRef, useState } from 'react'
import { PhysicsCard } from '../../physics/PhysicsCard'
import type { PhysicsHandle } from '../../physics/PhysicsWorld'
import type { SandboxConfig } from './state'
import { ResizeHandles } from './ResizeHandles'
import { FlourishMount } from './shaders/FlourishMount'
import { HiddenScroll } from './HiddenScroll'
import { CardHeader } from './CardHeader'

interface PlaygroundProps {
    config: SandboxConfig
    minimized: boolean
    onMinimize: () => void
}

const DEFAULT_W = 320
const DEFAULT_H = 220

function computeAnchor(): { x: number; y: number } {
    const availableW = window.innerWidth - 220 // subtract control panel
    const availableH = window.innerHeight - 120 // subtract chrome + flavor strip
    return {
        x: availableW * 0.38,
        y: 120 + availableH * 0.45,
    }
}

const LOREM =
    'Type specimen — the quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow. Now is the time for bold decisions.'

export function Playground({ config, minimized, onMinimize }: PlaygroundProps) {
    const handleRef = useRef<PhysicsHandle | null>(null)
    const [anchor, setAnchor] = useState<{ x: number; y: number }>(() =>
        typeof window !== 'undefined' ? computeAnchor() : { x: 400, y: 350 },
    )
    const [cardSize, setCardSize] = useState({ width: DEFAULT_W, height: DEFAULT_H })
    const [locked, setLocked] = useState(false)

    useEffect(() => {
        const onResize = () => setAnchor(computeAnchor())
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    if (minimized) return null

    return (
        <PhysicsCard
            text={LOREM}
            fontKey="body"
            maxWidth={cardSize.width - 48}
            anchor={anchor}
            width={cardSize.width}
            height={cardSize.height}
            variant="playground"
            physicsHandleRef={handleRef}
            interactionMode={locked ? 'locked' : 'free'}
            header={<CardHeader locked={locked} onChange={setLocked} />}
        >
            {/* Shader flourish — absolutely positioned behind content within the fixed card */}
            <FlourishMount
                flourish={config.flourish}
                style={{ position: 'absolute', inset: 0, zIndex: 1 }}
            />

            {/* Card content — above the shader layer */}
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
                <HiddenScroll
                    indicator={config.scrollIndicator}
                    style={{ flex: 1 }}
                >
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9em' }}>
                        Playground
                    </p>
                    <p style={{ margin: '6px 0 0' }}>{LOREM}</p>
                    <p style={{ margin: '6px 0 0', opacity: 0.55 }}>{LOREM}</p>
                </HiddenScroll>
                <button
                    onClick={onMinimize}
                    style={{
                        alignSelf: 'flex-start',
                        fontFamily: 'var(--card-font-body, inherit)',
                        fontSize: 11,
                        padding: '2px 8px',
                        background: 'var(--card-accent, var(--color-accent))',
                        color: 'var(--card-bg, var(--color-bg))',
                        border:
                            '1px solid var(--card-border-color, currentColor)',
                        cursor: 'pointer',
                    }}
                >
                    minimize ↓
                </button>
            </div>

            {/* Resize handles — topmost layer, position absolute covers entire card */}
            <ResizeHandles
                physicsHandleRef={handleRef}
                width={cardSize.width}
                height={cardSize.height}
                anchor={anchor}
                resizeMode={config.resizeMode}
                snapToGrid={config.snapToGrid}
                springDuringResize={config.springDuringResize}
                onResizeCommit={(newSize, newAnchor) => {
                    setCardSize(newSize)
                    setAnchor(newAnchor)
                }}
            />
        </PhysicsCard>
    )
}
