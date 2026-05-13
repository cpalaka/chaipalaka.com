import type { PhysicsHandle, Vec2 } from './PhysicsWorld'

export interface BodyForceSource {
    getPosition(h: PhysicsHandle): Vec2
    getMass(h: PhysicsHandle): number
    isStatic(h: PhysicsHandle): boolean
    applyForce(h: PhysicsHandle, force: Vec2): void
}
