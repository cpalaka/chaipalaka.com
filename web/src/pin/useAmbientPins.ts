import { useEffect } from 'react'
import { usePin } from './PinContext'
import {
    buildAmbientPinSpecs,
    type AmbientPinSpec,
    type Resolved,
} from './ambientPins'
import type { Resting } from '../physics/PageSpec'

/**
 * Seeds a **populated** route's ambient-teacher cards on arrival (spec §7/§12)
 * and removes them when the route unmounts.
 *
 * Seeding is deferred to the next animation frame for two reasons: (1) the source
 * words must be laid out before `getBoundingClientRect`, and (2) `LadderReset`
 * clears all pins on a pathname change *during* the effect flush — a card seeded
 * synchronously on a nav *into* this route would be wiped, since this route's
 * mount effect runs before LadderReset's. The rAF runs after that flush, so the
 * ambient cards survive both a direct load and an in-app navigation here.
 *
 * `specs` must be stable (a module const / useMemo); a new array each render
 * re-seeds every frame.
 */
export function useAmbientPins(
    resting: Resting | undefined,
    specs: readonly AmbientPinSpec[],
): void {
    const pin = usePin()

    useEffect(() => {
        let ids: string[] = []
        const raf = requestAnimationFrame(() => {
            const box = document.querySelector('[data-content-box]') ?? document
            const built = buildAmbientPinSpecs(resting, specs, (selector) => {
                const el = box.querySelector(selector)
                if (!el) return null
                const r = el.getBoundingClientRect()
                const rect: Resolved['rect'] = {
                    left: r.left,
                    top: r.top,
                    width: r.width,
                    height: r.height,
                }
                return { el, rect }
            })
            ids = built.map((s) => pin.pin(s))
        })
        return () => {
            cancelAnimationFrame(raf)
            ids.forEach((id) => pin.unpin(id))
        }
    }, [pin, resting, specs])
}
