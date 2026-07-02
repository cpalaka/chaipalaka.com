import { useEffect } from 'react'
import { usePhysicsWorld } from './PhysicsContext'
import type { PageSpec } from './PageSpec'

export function usePageDef(pageDef: PageSpec): void {
    const world = usePhysicsWorld()
    const { mode, gravity, driftScale } = pageDef

    useEffect(() => {
        // Resolve the site default here (spec §3.2 / AC#2: absent ⇒ drift).
        const resolved = mode ?? 'drift'
        world.setMode(resolved)
        world.setDriftScale(driftScale ?? 1)
        // Gravity direction is only meaningful in the dormant mode.
        if (resolved === 'gravity') world.setGravityDirection(gravity ?? 'down')
        return () => {
            // Reset to the site default so a route that leaves does not leak its
            // mode/intensity onto the next.
            world.setMode('drift')
            world.setDriftScale(1)
            world.setGravityDirection('down')
        }
    }, [world, mode, gravity, driftScale])
}
