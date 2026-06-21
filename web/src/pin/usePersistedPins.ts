import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { usePin } from './PinContext'
import { resolve as resolveLocator } from './pinLocator'
import {
    loadRoute,
    saveRoute,
    restorePinSpecs,
    serializePins,
} from './pinPersistence'

/**
 * The per-route **persisted pins** lifecycle (task-028; spec §7 fast-follow).
 * Owns the pinned-card half of the ladder reset that used to live in
 * `LadderReset`: on each route it **saves** the outgoing route's kept pins,
 * **clears** the ladder, then **restores** the entering route's pins after layout
 * (mirroring `useAmbientPins`' deferred seed). A full unload (reload / tab close)
 * never fires the route effect, so `pagehide`/`visibilitychange` cover that.
 *
 * Saving reads each card's cached runtime describer + its locator, so it works
 * even mid-navigation when the source words have already left the DOM. A route is
 * written only once it has ≥1 kept pin — ambient-only routes never become "owned"
 * (so their teacher re-seeds), and persisted routes suppress ambient via
 * `pinPersistence.hasRoute` (see `useAmbientPins`).
 */
export function usePersistedPins(): void {
    const pin = usePin()
    const { pathname } = useLocation()
    const prevRef = useRef<string | null>(null)

    const saveRoutePins = (route: string): void => {
        const pins = serializePins(pin.snapshot(), (id) => pin.describe(id))
        if (pins.length > 0) saveRoute(route, pins)
    }

    // Per-route: save the outgoing route → reset → restore the entering route.
    useEffect(() => {
        const prev = prevRef.current
        if (prev !== null && prev !== pathname) saveRoutePins(prev)
        pin.clear()
        prevRef.current = pathname

        const target = pathname
        const raf = requestAnimationFrame(() => {
            const box = document.querySelector('[data-content-box]') ?? document
            const specs = restorePinSpecs(loadRoute(target), (loc) => {
                const el = resolveLocator(loc, box)
                if (!el) return null
                const r = el.getBoundingClientRect()
                return {
                    el,
                    rect: {
                        left: r.left,
                        top: r.top,
                        width: r.width,
                        height: r.height,
                    },
                }
            })
            specs.forEach((s) => pin.pin(s))
        })
        return () => cancelAnimationFrame(raf)
        // saveRoutePins reads only stable refs + the stable store.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, pin])

    // Full unload: persist the current route. SPA nav is covered by the effect
    // above; this catches reload and tab-close.
    useEffect(() => {
        const onHide = () => {
            const route = prevRef.current
            if (route !== null) saveRoutePins(route)
        }
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') onHide()
        }
        window.addEventListener('pagehide', onHide)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('pagehide', onHide)
            document.removeEventListener('visibilitychange', onVisibility)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pin])
}
