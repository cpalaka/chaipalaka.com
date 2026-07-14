import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { detectWebGPU } from './detect-webgpu'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { ErrorBoundary } from '../lib/ErrorBoundary'
import './AuraLayer.css'

// Lazily load the WebGPU scene so `three/webgpu` (slice 2) never lands in a
// shared chunk. Cached at module scope so the wrapper isn't recreated per render.
const LazyAuraScene = lazy(() =>
    import('./aura/AuraScene').then((m) => ({ default: m.AuraScene })),
)

type Mode = 'pending' | 'webgpu' | 'fallback'

// Static fallback for the no-WebGPU / reduced-motion path (AC#4): a PNG baked
// from the live scene's own canvas (same look by construction) over a CSS
// mercury-blob gradient that shows while the PNG loads (or if it 404s).
// Extracted so the exact same visual serves as both the fallback-mode render
// and the Suspense fallback.
function AuraFallback() {
    return (
        <div className="aura-layer__fallback">
            <img src="/fallbacks/aura.png" alt="" loading="lazy" />
        </div>
    )
}

/**
 * Aura overlay shell (task-038). Mirrors BackgroundCanvas's mode machine:
 * WebGPU is detected in an effect (SSG-safe — nothing touches `navigator.gpu` at
 * module scope or during render), `prefers-reduced-motion` forces the static
 * fallback, and only the `webgpu` path lazily mounts the scene chunk. The layer
 * sits above the background canvas and below the cards (z-index in AuraLayer.css).
 */
export function AuraLayer() {
    const reduced = usePrefersReducedMotion()
    const [detected, setDetected] = useState<Mode>('pending')
    // One-way latch to the static fallback. WebGPU passing `detectWebGPU` does
    // not guarantee the pipeline survives: `renderer.init()` can still reject
    // (adapter lost between detect and init), the TSL scene can throw at render,
    // or the GPU device can be lost at runtime (process crash, driver update,
    // dGPU→iGPU switch). Any of those flips this true → the AC#4 baked-PNG
    // fallback, mirroring BackgroundCanvas's one-way `setWebglMode('fallback')`.
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        let cancelled = false
        detectWebGPU().then((ok) => {
            if (!cancelled) setDetected(ok ? 'webgpu' : 'fallback')
        })
        return () => {
            cancelled = true
        }
    }, [])

    // Stable identity so passing it into the R3F gl factory / onDeviceLost never
    // re-configures the canvas; setState(true) is idempotent, so no functional
    // update is needed.
    const handleFail = useCallback(() => setFailed(true), [])

    // Reduced-motion and a WebGPU failure both force the static fallback;
    // `pending` renders nothing (SSG safety, matches BackgroundCanvas).
    const mode: Mode =
        detected === 'pending'
            ? 'pending'
            : reduced || failed
              ? 'fallback'
              : detected

    if (mode === 'pending') return null

    return (
        <div className="aura-layer" aria-hidden="true">
            {mode === 'fallback' ? (
                <AuraFallback />
            ) : (
                // Belt: a render-phase throw in the TSL scene degrades to the
                // fallback (and latches, so it is not remounted → re-thrown).
                // Braces (init rejection / device loss) are handled inside
                // AuraScene via onFail — an error boundary cannot catch those.
                <ErrorBoundary onError={handleFail} fallback={<AuraFallback />}>
                    <Suspense fallback={<AuraFallback />}>
                        <LazyAuraScene onFail={handleFail} />
                    </Suspense>
                </ErrorBoundary>
            )}
        </div>
    )
}
