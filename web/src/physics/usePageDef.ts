import { useEffect } from 'react'
import { usePhysicsWorld } from './PhysicsContext'
import type { PageSpec } from './PageSpec'

export function usePageDef(pageDef: PageSpec): void {
    const world = usePhysicsWorld()
    const { gravity } = pageDef

    useEffect(() => {
        world.setGravityDirection(gravity)
        return () => {
            world.setGravityDirection('down')
        }
    }, [world, gravity])
}
