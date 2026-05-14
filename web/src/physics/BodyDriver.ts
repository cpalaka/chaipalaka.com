/**
 * Type-only module: the seam between body primitives and the physics world.
 *
 * `PhysicsWorld` satisfies `BodyDriver` structurally — no separate adapter
 * class. A synchronous `createFakeBodyDriver()` factory satisfies it for
 * primitive tests, letting them assert the *shape* of motion (easing
 * endpoints, stagger gates, kick magnitudes/signs, captured-tether restore)
 * without booting a real matter.js world.
 *
 * Sibling, not superset, of `BodyForceSource`. The two interfaces overlap in
 * the readonly query methods (`getPosition`, `isStatic`); `PhysicsWorld`
 * satisfies both. Tether consumes `BodyForceSource`; body primitives consume
 * `BodyDriver`.
 *
 * `ceilingHandle` / `floorHandle` are deliberately absent from the seam:
 * `isStatic(parent)` carries the same filter through a topological property
 * rather than leaking world identity through the interface.
 */

import type { PhysicsHandle, Vec2 } from './PhysicsWorld'

export type { PhysicsHandle, Vec2 }

export interface TetherSpec {
    parent: PhysicsHandle
    child: PhysicsHandle
    length: number
    anchorA?: Vec2
}

export interface BodyDriver {
    // Identity & lookup
    getHandleById(id: string): PhysicsHandle | undefined
    has(h: PhysicsHandle): boolean

    // State reads
    getPosition(h: PhysicsHandle): Vec2
    getVelocity(h: PhysicsHandle): Vec2
    getSize(h: PhysicsHandle): { width: number; height: number }
    isStatic(h: PhysicsHandle): boolean
    getBuoyancy(h: PhysicsHandle): 'balloon' | 'heavy'
    getGravityVector(): Vec2

    // Per-body mutators
    setPosition(h: PhysicsHandle, v: Vec2): void
    setVelocity(h: PhysicsHandle, v: Vec2): void
    setDragging(h: PhysicsHandle, dragging: boolean): void
    setSensor(h: PhysicsHandle, asSensor: boolean): void

    // Tether (atomic, per-body). `detachTetherOf` returns the spec so the
    // caller decides whether to reattach (e.g. anchorSlide / pourInDrop
    // capture-and-restore; stringCutDrop selectively reattaches non-static
    // parents only).
    detachTetherOf(child: PhysicsHandle): TetherSpec | undefined
    attachTether(spec: TetherSpec): void
}
