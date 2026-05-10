import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from './PhysicsWorld'

const FIXED_DT_MS = 1000 / 60

describe('PhysicsWorld registration', () => {
    test('register returns a handle that can be unregistered', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.register(
            { x: 100, y: 100 },
            { width: 200, height: 80 },
        )
        expect(handle).toBeDefined()
        expect(world.has(handle)).toBe(true)
        world.unregister(handle)
        expect(world.has(handle)).toBe(false)
    })
})

describe('PhysicsWorld dynamics', () => {
    test('a freshly registered body sits exactly at its anchor', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.register(
            { x: 250, y: 175 },
            { width: 100, height: 50 },
        )
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(250, 5)
        expect(pos.y).toBeCloseTo(175, 5)
    })

    test('applyImpulse moves the body in the impulse direction on the next tick', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.register(
            { x: 100, y: 100 },
            { width: 100, height: 50 },
        )
        world.applyImpulse(handle, { x: 5, y: 0 })
        world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.x).toBeGreaterThan(100)
        expect(Math.abs(pos.y - 100)).toBeLessThan(1)
    })

})

describe('PhysicsWorld gravity', () => {
    test('setGravity(true) makes a card fall', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.register(
            { x: 100, y: 100 },
            { width: 100, height: 50 },
        )
        world.setGravity(true)
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        const fellTo = world.getPosition(handle)
        expect(fellTo.y).toBeGreaterThan(100)
    })

    test('with gravity on, the floor body catches a falling card (no escape)', () => {
        const viewport = { width: 800, height: 400 }
        const world = new PhysicsWorld({ viewport })
        const handle = world.register(
            { x: 100, y: 50 },
            { width: 100, height: 50 },
        )

        world.setGravity(true)
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)

        const pos = world.getPosition(handle)
        expect(pos.y).toBeLessThanOrEqual(viewport.height)
    })
})

describe('PhysicsWorld drag handles', () => {
    test('setPosition moves the body to the target coordinates immediately', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.register(
            { x: 100, y: 100 },
            { width: 100, height: 50 },
        )
        world.applyImpulse(handle, { x: 20, y: 0 })
        world.setPosition(handle, { x: 300, y: 250 })
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(300, 5)
        expect(pos.y).toBeCloseTo(250, 5)
    })
})

describe('PhysicsWorld transform callback', () => {
    test('register with onTransform: callback fires each tick with current body state', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const states: Array<{ x: number; y: number }> = []
        world.register(
            { x: 100, y: 100 },
            { width: 100, height: 50 },
            { onTransform: (s) => states.push({ x: s.x, y: s.y }) },
        )
        world.tick(FIXED_DT_MS)
        world.tick(FIXED_DT_MS)
        expect(states.length).toBe(2)
        expect(states[0]!.x).toBeCloseTo(100, 1)
    })
})

describe('PhysicsWorld dragging', () => {
    test('while dragging, the body stays where setPosition places it across many ticks', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.register(
            { x: 100, y: 100 },
            { width: 100, height: 50 },
        )
        world.setDragging(handle, true)
        world.setPosition(handle, { x: 400, y: 300 })
        for (let i = 0; i < 60; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(400, 1)
        expect(pos.y).toBeCloseTo(300, 1)
    })

    test('setVelocity directly sets the body velocity (mass-independent)', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.register(
            { x: 400, y: 100 },
            { width: 100, height: 50 },
        )
        world.setVelocity(handle, { x: 5, y: 0 })
        world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.x).toBeGreaterThan(401)
    })

    test('after release, applyImpulse adds velocity to a body that was dragged', () => {
        const release = (impulseX: number) => {
            const world = new PhysicsWorld({
                viewport: { width: 800, height: 600 },
            })
            const handle = world.register(
                { x: 100, y: 100 },
                { width: 100, height: 50 },
            )
            world.setDragging(handle, true)
            world.setPosition(handle, { x: 200, y: 100 })
            world.setDragging(handle, false)
            if (impulseX !== 0)
                world.applyImpulse(handle, { x: impulseX, y: 0 })
            world.tick(FIXED_DT_MS)
            return world.getPosition(handle).x
        }
        expect(release(100)).toBeGreaterThan(release(0))
    })
})

describe('PhysicsWorld setSize', () => {
    test('setSize throws for unknown handle', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        expect(() => world.setSize(999, { width: 100, height: 50 })).toThrow()
    })

    test('getSize returns initial registered dimensions', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register(
            { x: 200, y: 200 },
            { width: 100, height: 50 },
        )
        expect(world.getSize(handle)).toEqual({ width: 100, height: 50 })
    })

    test('setSize updates the stored dimensions', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register(
            { x: 200, y: 200 },
            { width: 100, height: 50 },
        )
        world.setSize(handle, { width: 200, height: 100 })
        expect(world.getSize(handle)).toEqual({ width: 200, height: 100 })
    })

    test('setSize preserves body center position', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register(
            { x: 200, y: 200 },
            { width: 100, height: 50 },
        )
        world.setSize(handle, { width: 200, height: 100 })
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(200, 5)
        expect(pos.y).toBeCloseTo(200, 5)
    })

    test('setSize is idempotent for the same dimensions', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register(
            { x: 200, y: 200 },
            { width: 100, height: 50 },
        )
        world.setSize(handle, { width: 200, height: 100 })
        world.setSize(handle, { width: 200, height: 100 })
        expect(world.getSize(handle)).toEqual({ width: 200, height: 100 })
    })

    test('setSize can grow and then shrink back to the original dimensions', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register(
            { x: 200, y: 200 },
            { width: 100, height: 50 },
        )
        world.setSize(handle, { width: 200, height: 100 })
        world.setSize(handle, { width: 100, height: 50 })
        expect(world.getSize(handle)).toEqual({ width: 100, height: 50 })
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(200, 5)
        expect(pos.y).toBeCloseTo(200, 5)
    })
})

describe('PhysicsWorld static registration (gravity-exempt)', () => {
    test('registerStatic returns a handle that can be queried and unregistered', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.registerStatic(
            { x: 200, y: 500 },
            { width: 120, height: 60 },
        )
        expect(handle).toBeDefined()
        expect(world.has(handle)).toBe(true)
        world.unregister(handle)
        expect(world.has(handle)).toBe(false)
    })

    test('a static body sits at its initial position', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.registerStatic(
            { x: 200, y: 500 },
            { width: 120, height: 60 },
        )
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(200, 5)
        expect(pos.y).toBeCloseTo(500, 5)
    })

    test('a static body does not fall when gravity is on', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.registerStatic(
            { x: 200, y: 200 },
            { width: 120, height: 60 },
        )
        world.setGravity(true)
        for (let i = 0; i < 60; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.y).toBeCloseTo(200, 1)
    })

    test('setPosition moves a static body to the target immediately', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.registerStatic(
            { x: 200, y: 500 },
            { width: 120, height: 60 },
        )
        world.setPosition(handle, { x: 400, y: 300 })
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(400, 5)
        expect(pos.y).toBeCloseTo(300, 5)
    })

    test('a static body stays put after setPosition across many ticks with gravity', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.registerStatic(
            { x: 200, y: 500 },
            { width: 120, height: 60 },
        )
        world.setGravity(true)
        world.setPosition(handle, { x: 400, y: 300 })
        for (let i = 0; i < 120; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(400, 1)
        expect(pos.y).toBeCloseTo(300, 1)
    })
})

describe('PhysicsWorld linkBodies / unlinkBodies', () => {
    test('linkBodies returns a numeric link handle', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const a = world.register({ x: 100, y: 200 }, { width: 80, height: 40 })
        const b = world.register({ x: 400, y: 200 }, { width: 80, height: 40 })
        const link = world.linkBodies(a, b)
        expect(link).toBeTypeOf('number')
    })

    test('linkBodies with tight stiffness pulls bodies together over time', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const a = world.register({ x: 100, y: 200 }, { width: 80, height: 40 })
        const b = world.register({ x: 400, y: 200 }, { width: 80, height: 40 })
        world.linkBodies(a, b, { length: 0, stiffness: 0.5, damping: 0.5 })
        for (let i = 0; i < 200; i++) world.tick(FIXED_DT_MS)
        const posA = world.getPosition(a)
        const posB = world.getPosition(b)
        const dist = Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y)
        expect(dist).toBeLessThan(20)
    })

    test('unlinkBodies removes the constraint so bodies no longer converge', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const a = world.register({ x: 100, y: 200 }, { width: 80, height: 40 })
        const b = world.register({ x: 400, y: 200 }, { width: 80, height: 40 })
        const link = world.linkBodies(a, b, { length: 0, stiffness: 0.5, damping: 0.5 })
        world.unlinkBodies(link)
        for (let i = 0; i < 200; i++) world.tick(FIXED_DT_MS)
        const posA = world.getPosition(a)
        const posB = world.getPosition(b)
        const dist = Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y)
        expect(dist).toBeGreaterThan(50)
    })

    test('linkBodies throws for an unknown handle', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const a = world.register({ x: 100, y: 200 }, { width: 80, height: 40 })
        expect(() => world.linkBodies(a, 999)).toThrow()
        expect(() => world.linkBodies(999, a)).toThrow()
    })

    test('linkBodies with no opts does not throw (uses defaults)', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const a = world.register({ x: 100, y: 200 }, { width: 80, height: 40 })
        const b = world.register({ x: 400, y: 200 }, { width: 80, height: 40 })
        expect(() => world.linkBodies(a, b)).not.toThrow()
    })
})

describe('PhysicsWorld setSensor', () => {
    test('setSensor throws for an unknown handle', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        expect(() => world.setSensor(999, true)).toThrow()
    })

    test('setSensor does not throw for a valid handle', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 100, y: 100 }, { width: 80, height: 40 })
        expect(() => world.setSensor(handle, true)).not.toThrow()
        expect(() => world.setSensor(handle, false)).not.toThrow()
    })
})

describe('PhysicsWorld setStatic', () => {
    test('setStatic throws for an unknown handle', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        expect(() => world.setStatic(999, true)).toThrow()
    })

    test('setStatic(true) pins the body so a large impulse does not move it', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 200, y: 200 }, { width: 100, height: 50 })
        world.setStatic(handle, true)
        world.applyImpulse(handle, { x: 500, y: 0 })
        for (let i = 0; i < 60; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(Math.abs(pos.x - 200)).toBeLessThan(1)
        expect(Math.abs(pos.y - 200)).toBeLessThan(1)
    })

    test('setStatic(false) restores normal physics so impulse moves the body', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 200, y: 200 }, { width: 100, height: 50 })
        world.setStatic(handle, true)
        world.setStatic(handle, false)
        world.applyImpulse(handle, { x: 50, y: 0 })
        world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.x).toBeGreaterThan(200)
    })

    test('setStatic is idempotent across lock/unlock toggles', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 200, y: 200 }, { width: 100, height: 50 })
        world.setStatic(handle, true)
        world.setStatic(handle, false)
        world.setStatic(handle, true)
        world.setStatic(handle, false)
        world.applyImpulse(handle, { x: 50, y: 0 })
        world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.x).toBeGreaterThan(200)
    })
})
