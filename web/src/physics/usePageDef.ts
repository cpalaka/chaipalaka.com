import { useEffect } from 'react'
import { usePhysicsWorld } from './PhysicsContext'
import type { PageDef } from './PageDef'

export function usePageDef(pageDef: PageDef): void {
    const world = usePhysicsWorld()
    const { gravity } = pageDef

    useEffect(() => {
        world.setGravityDirection(gravity)
        return () => {
            world.setGravityDirection('down')
        }
    }, [world, gravity])
}
