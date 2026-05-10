import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { FlourishMode } from '../state'

// Track how many flourish canvases are currently visible across all instances.
// Cap at 3 to stay within browser WebGL context limits.
let globalFlourishCount = 0
const MAX_FLOURISH = 3

const StaticGradientCanvas = lazy(() =>
    import('./StaticGradient').then((m) => ({
        default: function Wrapper() {
            return <m.StaticGradientScene />
        },
    })),
)
const WavyEdgeCanvas = lazy(() =>
    import('./WavyEdge').then((m) => ({
        default: function Wrapper() {
            return <m.WavyEdgeScene />
        },
    })),
)
const NoiseFieldCanvas = lazy(() =>
    import('./NoiseField').then((m) => ({
        default: function Wrapper() {
            return <m.NoiseFieldScene />
        },
    })),
)

interface FlourishMountProps {
    flourish: FlourishMode
    children?: React.ReactNode
    style?: React.CSSProperties
    className?: string
}

export function FlourishMount({
    flourish,
    children,
    style,
    className,
}: FlourishMountProps) {
    const [slotGranted, setSlotGranted] = useState(false)
    const mounted = useRef(false)

    useEffect(() => {
        if (flourish === 'off') {
            if (mounted.current) {
                globalFlourishCount--
                mounted.current = false
                setSlotGranted(false)
            }
            return
        }
        if (!mounted.current) {
            if (globalFlourishCount < MAX_FLOURISH) {
                globalFlourishCount++
                mounted.current = true
                setSlotGranted(true)
            } else {
                setSlotGranted(false)
            }
        }
        return () => {
            if (mounted.current) {
                globalFlourishCount--
                mounted.current = false
            }
        }
    }, [flourish])

    const SceneComponent =
        flourish === 'static-gradient'
            ? StaticGradientCanvas
            : flourish === 'wavy-edge'
              ? WavyEdgeCanvas
              : flourish === 'noise-field'
                ? NoiseFieldCanvas
                : null

    return (
        <div
            className={className}
            style={{ position: 'relative', pointerEvents: 'none', ...style }}
        >
            {SceneComponent && slotGranted && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        opacity: 0.3,
                        pointerEvents: 'none',
                        overflow: 'hidden',
                    }}
                    aria-hidden="true"
                >
                    <Suspense fallback={null}>
                        <Canvas
                            gl={{ antialias: false, powerPreference: 'low-power' }}
                            dpr={[1, 1]}
                        >
                            <SceneComponent />
                        </Canvas>
                    </Suspense>
                </div>
            )}
            {SceneComponent && !slotGranted && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        background:
                            'linear-gradient(135deg, rgba(100,80,0,0.3), rgba(0,0,0,0.5))',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '4px 6px',
                        pointerEvents: 'none',
                    }}
                    title="WebGL context cap reached (max 3)"
                    aria-hidden="true"
                >
                    <span style={{ fontSize: 9, opacity: 0.5, fontFamily: 'monospace' }}>
                        ctx limit
                    </span>
                </div>
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    )
}
