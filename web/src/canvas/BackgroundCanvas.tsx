import { Canvas } from '@react-three/fiber'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { detectWebGL } from './detect-webgl'
import { useGallery } from './useGallery'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import type { BackgroundScene } from './types'
import { getSceneEntry } from './scenes/registry'
import './BackgroundCanvas.css'

// Cache React.lazy wrappers so they aren't recreated on re-renders.
const sceneLazyCache = new Map<
    string,
    React.LazyExoticComponent<React.ComponentType>
>()

/** @internal — exported for tests; not part of the public API. */
export function getLazyScene(scene: BackgroundScene) {
    if (!sceneLazyCache.has(scene.id)) {
        const entry = getSceneEntry(scene.id)
        if (!entry) throw new Error(`No loader for scene: ${scene.id}`)
        sceneLazyCache.set(
            scene.id,
            lazy(() => entry.loader().then((m) => ({ default: m.Scene }))),
        )
    }
    return sceneLazyCache.get(scene.id)!
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

// The no-JS background baseline is the default scene's gradient — a constant,
// NOT the gallery's active scene. `active` is read from localStorage on the
// first client render (useController → useState initialiser), which would
// differ from the server's always-default value and tear hydration. The
// default id mirrors useGallery's `defaultId`.
const NOJS_BASELINE_PNG =
    getSceneEntry('flow-shader')?.scene.fallbackPng ??
    '/fallbacks/flow-shader.png'

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

    const handleContextLost = () => setWebglMode('fallback')

    return (
        <>
            {/* No-JS baseline: the default scene's static gradient, prerendered
                so SSG canvas routes are not a blank shell without JS (#85).
                Hidden once JS hydrates (CSS gated on the no-js <html> class —
                base.css). A background-image on a display:none element is not
                fetched, so JS users pay nothing for it. */}
            <div
                className="background-canvas-layer background-canvas-nojs"
                data-nojs-fallback
                aria-hidden="true"
                style={{ backgroundImage: `url(${NOJS_BASELINE_PNG})` }}
            />
            {mode === 'pending' ? null : (
                <div className="background-canvas-layer" aria-hidden="true">
                    {outgoing && (
                        <SceneLayer scene={outgoing} mode={mode} fading />
                    )}
                    <SceneLayer
                        scene={current}
                        mode={mode}
                        onContextLost={handleContextLost}
                    />
                </div>
            )}
        </>
    )
}
