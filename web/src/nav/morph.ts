import {
    useCallback,
    useSyncExternalStore,
    type MouseEvent as ReactMouseEvent,
} from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * The shared `view-transition-name` that pairs a clicked Portal **Card** (the
 * source) with the destination **content box** for the v2 **hero morph**
 * (ADR-0007). Only ever one navigation is in flight, so a single global name is
 * safe: the source card claims it on the page it is leaving (the old snapshot)
 * and the destination box claims it on the page just arrived at (the new
 * snapshot) — they never coexist in one snapshot.
 */
export const HERO_NAME = 'morph-hero'

/**
 * Transient signal: the path a Portal card is currently morphing INTO, or null.
 *
 * Why not `useViewTransitionState`? That hook matches a transition's *from* AND
 * *to* location, so it can't tell a source content box (whose path is the
 * from-location) from the destination box (the to-location) — both would claim
 * `morph-hero` and the browser aborts the transition for a duplicate name. This
 * signal names source vs destination unambiguously: the source card matches on
 * `to` while it has not yet arrived; the destination box matches on its own
 * (arrived) path. A `Controller`-shaped module singleton (get/subscribe/set).
 */
let morphTarget: string | null = null
const subscribers = new Set<() => void>()
const morphStore = {
    get: (): string | null => morphTarget,
    set: (next: string | null): void => {
        if (morphTarget === next) return
        morphTarget = next
        subscribers.forEach((cb) => cb())
    },
    subscribe: (cb: () => void): (() => void) => {
        subscribers.add(cb)
        return () => {
            subscribers.delete(cb)
        }
    },
}

function useMorphTarget(): string | null {
    return useSyncExternalStore(
        morphStore.subscribe,
        morphStore.get,
        () => null,
    )
}

export interface MorphSource {
    /** True while THIS card is the source of an in-flight morph (old snapshot). */
    isMorphing: boolean
    /** Navigate to the destination as a hero morph (a no-op for Pocket cards). */
    enter: () => void
    /** Click handler for a Portal card's body `<a>`: morph on a plain left-click
     * (same as the title bar), leaving modified clicks / no-JS to the native href. */
    onBodyClick: (e: ReactMouseEvent) => void
}

/**
 * Wires a Portal card to act as the hero-morph source. `enter()` flushes the
 * card's `view-transition-name` on (via the morph signal) BEFORE navigating, so
 * the card is captured named in the old snapshot, then react-router's
 * `viewTransition` nav runs the browser transition (degrading to a plain nav on
 * unsupported browsers). The name is dropped once the route arrives
 * (`pathname === to`) so only the destination box carries it in the new
 * snapshot. Pocket cards (no href) never morph.
 */
export function useMorphSource(
    kind: string,
    href: string | undefined,
): MorphSource {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const target = useMorphTarget()
    const to = kind === 'portal' && href ? href : undefined
    const isMorphing = to !== undefined && target === to && pathname !== to
    const enter = useCallback(() => {
        if (!to) return
        // Name the card synchronously so it exists in the old snapshot react-router
        // captures the instant `navigate` starts the view transition. The next
        // `enter` overwrites the target; we deliberately do NOT clear it on arrival
        // — every clear path races the destination snapshot (a route-change effect
        // fires inside react-router's flushSync, before capture; a rAF fires during
        // react-router's cross-frame transition, also before capture). A lingering
        // target only names the just-arrived box at rest (inert) and gives it a
        // fade when you later view-transition away from it — harmless.
        flushSync(() => morphStore.set(to))
        navigate(to, { viewTransition: true })
    }, [navigate, to])
    const onBodyClick = useCallback(
        (e: ReactMouseEvent) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
                return
            e.preventDefault()
            enter()
        },
        [enter],
    )
    return { isMorphing, enter, onBodyClick }
}

/**
 * True when the calling element's route IS the destination of an in-flight morph
 * — i.e. the page just arrived at. The destination **content box** uses this to
 * claim `morph-hero` only on the new snapshot, never on the source page.
 */
export function useMorphDestination(): boolean {
    const { pathname } = useLocation()
    const target = useMorphTarget()
    return target === pathname
}

/**
 * Navigate via a plain client view transition — the **physical default**
 * (a root crossfade) — for a direct Portal word-click, which has no source card
 * to morph from. Clears any lingering morph target first (flushSync so it lands
 * before react-router captures the old snapshot) so nothing is named and the nav
 * is a clean crossfade rather than a stray morph.
 */
export function usePhysicalNav(): (to: string) => void {
    const navigate = useNavigate()
    return useCallback(
        (to: string) => {
            flushSync(() => morphStore.set(null))
            navigate(to, { viewTransition: true })
        },
        [navigate],
    )
}
