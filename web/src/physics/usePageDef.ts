import { useEffect } from 'react'
import { usePhysicsWorld } from './PhysicsContext'
import {
    prefersReducedMotion,
    usePrefersReducedMotion,
} from '../lib/usePrefersReducedMotion'
import type { PageSpec } from './PageSpec'

export function usePageDef(pageDef: PageSpec): void {
    const world = usePhysicsWorld()
    const { mode, gravity, driftScale } = pageDef
    // D8: prefers-reduced-motion ⇒ driftScale 0 — stills both the run-and-tumble
    // wander and the driftScale-gated prose repel (AC#10). Drag/peek and the
    // pin freeze/park/recall gates are separate paths and stay live (ADR-0008).
    // The hook drives runtime reactivity (a media-query change re-fires the
    // effect); the synchronous read below covers the first pass.
    const reduced = usePrefersReducedMotion()

    useEffect(() => {
        // Resolve the site default here (spec §3.2 / AC#2: absent ⇒ drift).
        const resolved = mode ?? 'drift'
        world.setMode(resolved)
        // Read matchMedia synchronously so the FIRST effect pass already honors
        // reduced-motion: the hook inits false (SSR-safe) and only flips a commit
        // later, which would otherwise leave a one-frame window at the authored
        // driftScale that the rAF loop can tick through (task-042.04 review ④).
        const reducedNow = reduced || prefersReducedMotion()
        world.setDriftScale(reducedNow ? 0 : (driftScale ?? 1))
        // Gravity direction is only meaningful in the dormant mode.
        if (resolved === 'gravity') world.setGravityDirection(gravity ?? 'down')
        return () => {
            // Reset to the site default so a route that leaves does not leak its
            // mode/intensity onto the next (keep reduced-motion pinned to 0).
            world.setMode('drift')
            world.setDriftScale(reducedNow ? 0 : 1)
            world.setGravityDirection('down')
        }
    }, [world, mode, gravity, driftScale, reduced])
}
