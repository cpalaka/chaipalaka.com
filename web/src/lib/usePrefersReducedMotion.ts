import { useEffect, useState } from 'react'

/**
 * Synchronous, non-hook read of `prefers-reduced-motion`. SSR-safe (false when
 * `window`/`matchMedia` is absent). Use this at **client-only effect** sites that
 * must decide before {@link usePrefersReducedMotion}'s state settles — the hook
 * initialises `false` (to match the prerendered HTML and avoid a hydration
 * mismatch) and only flips in an effect, which lags a commit. Reading it in an
 * effect is safe: effects never run during SSR/hydration render.
 */
export function prefersReducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
}

export function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduced(mq.matches)
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])
    return reduced
}
