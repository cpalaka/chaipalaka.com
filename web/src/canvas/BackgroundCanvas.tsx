import { Canvas } from '@react-three/fiber'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { detectWebGL } from './detect-webgl'
import { useGallery } from './useGallery'
import type { BackgroundScene } from './types'
import './BackgroundCanvas.css'

// Static import() paths are required for Vite chunk analysis — one chunk per scene.
const sceneLoaders: Record<string, () => Promise<unknown>> = {
    'flow-shader': () => import('./scenes/flow-shader'),
    'particles-starfield': () => import('./scenes/particles-starfield'),
    'particles-cursor': () => import('./scenes/particles-cursor'),
    'particles-flow': () => import('./scenes/particles-flow'),
    'particles-boids': () => import('./scenes/particles-boids'),
    'geometric-reaction-diffusion': () => import('./scenes/geometric-reaction-diffusion'),
    'geometric-voronoi': () => import('./scenes/geometric-voronoi'),
    'geometric-subdivision': () => import('./scenes/geometric-subdivision'),
    'audio-reactive': () => import('./scenes/audio-reactive'),
}

// Cache React.lazy wrappers so they aren't recreated on re-renders.
const sceneLazyCache = new Map<
    string,
    React.LazyExoticComponent<() => React.ReactElement | null>
>()

function getLazyScene(scene: BackgroundScene) {
    if (!sceneLazyCache.has(scene.id)) {
        const loader = sceneLoaders[scene.id]
        if (!loader) throw new Error(`No loader for scene: ${scene.id}`)
        // Dynamic import returns a module; extract the Component.
        const lazyComp = lazy(async () => {
            const mod = (await loader()) as Record<string, unknown>
            // Find the exported BackgroundScene entry and return its Component.
            const entry = Object.values(mod).find(
                (v): v is BackgroundScene =>
                    typeof v === 'object' &&
                    v !== null &&
                    'Component' in v &&
                    'id' in v &&
                    (v as BackgroundScene).id === scene.id,
            )
            if (!entry)
                throw new Error(
                    `Scene module for "${scene.id}" has no matching export`,
                )
            const SceneComponent =
                entry.Component as () => React.ReactElement | null
            return { default: SceneComponent }
        })
        sceneLazyCache.set(scene.id, lazyComp)
    }
    return sceneLazyCache.get(scene.id)!
}

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduced(mq.matches)
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])
    return reduced
}

// useFadeSwap: tracks the outgoing scene during a cross-fade window (~250ms).
// Outside the window, only `active` is mounted.
function useFadeSwap(active: BackgroundScene): {
    current: BackgroundScene
    outgoing: BackgroundScene | null
} {
    const [current, setCurrent] = useState(active)
    const [outgoing, setOutgoing] = useState<BackgroundScene | null>(null)
    const prevRef = useRef(active)

    useEffect(() => {
        if (prevRef.current.id === active.id) return
        const prev = prevRef.current
        prevRef.current = active
        setCurrent(active)
        setOutgoing(prev)
        const timer = setTimeout(() => setOutgoing(null), 300)
        return () => clearTimeout(timer)
    }, [active])

    return { current, outgoing }
}

type Mode = 'pending' | 'webgl' | 'fallback'

interface LayerProps {
    scene: BackgroundScene
    mode: Mode
    fading?: boolean
    onContextLost?: () => void
}

// Defined at module level so it's never recreated during parent renders.
function SceneLayer({
    scene,
    mode,
    fading = false,
    onContextLost,
}: LayerProps) {
    const canvasElRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        if (mode !== 'webgl' || !onContextLost) return
        const el = canvasElRef.current
        if (!el) return
        const handler = (e: Event) => {
            e.preventDefault()
            onContextLost()
        }
        el.addEventListener('webglcontextlost', handler)
        return () => el.removeEventListener('webglcontextlost', handler)
    }, [mode, onContextLost])

    if (mode === 'fallback') {
        return (
            <div
                className="background-canvas-layer__layer"
                data-fading={fading ? 'out' : undefined}
            >
                <img
                    className="background-canvas-fallback"
                    src={scene.fallbackPng}
                    alt=""
                    decoding="async"
                />
            </div>
        )
    }

    const SceneComponent = getLazyScene(scene)
    return (
        <div
            className="background-canvas-layer__layer"
            data-fading={fading ? 'out' : undefined}
        >
            <Suspense fallback={null}>
                <Canvas
                    gl={{ antialias: false, powerPreference: 'low-power' }}
                    dpr={[1, 1.5]}
                    onCreated={(state) => {
                        canvasElRef.current = state.gl.domElement
                    }}
                >
                    <SceneComponent />
                </Canvas>
            </Suspense>
        </div>
    )
}

export function BackgroundCanvas() {
    const { active } = useGallery()
    const reduced = usePrefersReducedMotion()
    const [webglMode, setWebglMode] = useState<Mode>('pending')
    const { current, outgoing } = useFadeSwap(active)

    useEffect(() => {
        setWebglMode(detectWebGL(document) ? 'webgl' : 'fallback')
    }, [])

    // Reduced-motion always shows static gradient; pending hides background (SSG safety).
    const mode: Mode =
        webglMode === 'pending' ? 'pending' : reduced ? 'fallback' : webglMode

    if (mode === 'pending') return null

    const handleContextLost = () => setWebglMode('fallback')

    return (
        <div className="background-canvas-layer" aria-hidden="true">
            {outgoing && <SceneLayer scene={outgoing} mode={mode} fading />}
            <SceneLayer
                scene={current}
                mode={mode}
                onContextLost={handleContextLost}
            />
        </div>
    )
}
