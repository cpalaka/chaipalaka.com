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
    test('gravity is on by default — a registered body falls downward', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.register(
            { x: 100, y: 100 },
            { width: 100, height: 50 },
        )
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        const fellTo = world.getPosition(handle)
        expect(fellTo.y).toBeGreaterThan(100)
    })

    test('floor catches a falling body', () => {
        const viewport = { width: 800, height: 400 }
        const world = new PhysicsWorld({ viewport })
        const handle = world.register(
            { x: 100, y: 50 },
            { width: 100, height: 50 },
        )
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.y).toBeLessThanOrEqual(viewport.height)
    })
})

describe('PhysicsWorld gravity direction', () => {
    test('setGravityDirection("down") makes a body fall in positive y', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 400, y: 200 }, { width: 80, height: 40 })
        world.setGravityDirection('down')
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        expect(world.getPosition(handle).y).toBeGreaterThan(200)
    })

    test('setGravityDirection("up") makes a body rise in negative y', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 400, y: 400 }, { width: 80, height: 40 })
        world.setGravityDirection('up')
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        expect(world.getPosition(handle).y).toBeLessThan(400)
    })

    test('setGravityDirection("left") makes a body drift in negative x', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 400, y: 300 }, { width: 80, height: 40 })
        world.setGravityDirection('left')
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        expect(world.getPosition(handle).x).toBeLessThan(400)
    })

    test('setGravityDirection("right") makes a body drift in positive x', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 400, y: 300 }, { width: 80, height: 40 })
        world.setGravityDirection('right')
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        expect(world.getPosition(handle).x).toBeGreaterThan(400)
    })

    test('getGravityVector returns direction and non-zero magnitude', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const down = world.getGravityVector()
        expect(down.x).toBeCloseTo(0)
        expect(down.y).toBeGreaterThan(0)
        world.setGravityDirection('up')
        const up = world.getGravityVector()
        expect(up.y).toBeLessThan(0)
        world.setGravityDirection('left')
        const left = world.getGravityVector()
        expect(left.x).toBeLessThan(0)
    })

    test('ceiling catches a body rising under upward gravity', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const handle = world.register({ x: 400, y: 400 }, { width: 80, height: 40 })
        world.setGravityDirection('up')
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        // ceiling is near y=0; body should be stopped by it, not escaping to negative y
        expect(pos.y).toBeGreaterThanOrEqual(0)
    })
})

describe('PhysicsWorld setViewport', () => {
    test('setViewport repositions floor so new floor catches a falling body', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 400, y: 50 }, { width: 80, height: 40 })
        world.setViewport({ width: 800, height: 200 })
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.y).toBeLessThanOrEqual(200)
    })

    test('top inset at construction: ceiling stops upward-rising body at or below inset y', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 }, insets: { top: 40, bottom: 0 } })
        const handle = world.register({ x: 400, y: 400 }, { width: 80, height: 40 })
        world.setGravityDirection('up')
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.y).toBeGreaterThanOrEqual(40)
    })

    test('bottom inset at construction: floor catches a falling body above viewport bottom', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 400 }, insets: { top: 0, bottom: 40 } })
        const handle = world.register({ x: 400, y: 50 }, { width: 80, height: 40 })
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.y).toBeLessThanOrEqual(360)
    })

    test('setViewport with top inset repositions ceiling so rising body stops at inset y', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.register({ x: 400, y: 400 }, { width: 80, height: 40 })
        world.setGravityDirection('up')
        world.setViewport({ width: 800, height: 600 }, { top: 40, bottom: 0 })
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.y).toBeGreaterThanOrEqual(40)
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

describe('PhysicsWorld registerById', () => {
    test('registerById makes card retrievable by id', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.registerById('hero', { x: 100, y: 100 }, { width: 80, height: 40 })
        expect(world.getHandleById('hero')).toBe(handle)
    })

    test('registerById with duplicate id throws', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        world.registerById('card-1', { x: 100, y: 100 }, { width: 80, height: 40 })
        expect(() =>
            world.registerById('card-1', { x: 200, y: 200 }, { width: 80, height: 40 })
        ).toThrow()
    })

    test('unregister removes the id from the id map', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.registerById('card-1', { x: 100, y: 100 }, { width: 80, height: 40 })
        world.unregister(handle)
        expect(world.getHandleById('card-1')).toBeUndefined()
    })

    test('getHandleById returns undefined for unknown id', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        expect(world.getHandleById('missing')).toBeUndefined()
    })
})

describe('PhysicsWorld setBuoyancy', () => {
    test('balloon card is lifted against default downward gravity relative to heavy card', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const heavy = world.register({ x: 400, y: 300 }, { width: 80, height: 40 })
        const balloon = world.register({ x: 400, y: 300 }, { width: 80, height: 40 })
        world.setBuoyancy(balloon, 'balloon')
        for (let i = 0; i < 60; i++) world.tick(FIXED_DT_MS)
        const heavyPos = world.getPosition(heavy)
        const balloonPos = world.getPosition(balloon)
        expect(balloonPos.y).toBeLessThan(heavyPos.y)
    })

    test('setBuoyancy throws for unknown handle', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        expect(() => world.setBuoyancy(999, 'balloon')).toThrow()
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

    test('a static body does not fall under downward gravity', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.registerStatic(
            { x: 200, y: 200 },
            { width: 120, height: 60 },
        )
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

    test('a static body stays put after setPosition with gravity active', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const handle = world.registerStatic(
            { x: 200, y: 500 },
            { width: 120, height: 60 },
        )
        world.setPosition(handle, { x: 400, y: 300 })
        for (let i = 0; i < 120; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(400, 1)
        expect(pos.y).toBeCloseTo(300, 1)
    })
})

describe('PhysicsWorld tether', () => {
    test('tether returns a numeric handle', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const parent = world.registerStatic({ x: 400, y: 0 }, { width: 40, height: 40 })
        const child = world.register({ x: 400, y: 200 }, { width: 80, height: 40 })
        const th = world.tether(parent, child, 200)
        expect(th).toBeTypeOf('number')
    })

    test('body within tether length falls freely under gravity (not held)', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const parent = world.registerStatic({ x: 400, y: 0 }, { width: 40, height: 40 })
        const child = world.register({ x: 400, y: 50 }, { width: 80, height: 40 })
        world.tether(parent, child, 300)  // child at distance 50, tether length 300 → slack
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        expect(world.getPosition(child).y).toBeGreaterThan(50)  // fell under gravity
    })

    test('body stretched past tether length is pulled back and settles near tether length', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const parent = world.registerStatic({ x: 400, y: 100 }, { width: 40, height: 40 })
        const child = world.register({ x: 400, y: 300 }, { width: 80, height: 40 })
        world.tether(parent, child, 50)  // child at distance 200, tether length 50 → stretched
        for (let i = 0; i < 300; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(child)
        const dist = Math.hypot(pos.x - 400, pos.y - 100)
        expect(dist).toBeLessThan(100)  // settled near tether length of 50
    })

    test('untether removes the pull-only force so body falls freely', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const parent = world.registerStatic({ x: 400, y: 50 }, { width: 40, height: 40 })
        const child = world.register({ x: 400, y: 200 }, { width: 80, height: 40 })
        const th = world.tether(parent, child, 50)
        world.untether(th)
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(child)
        const dist = Math.hypot(pos.x - 400, pos.y - 50)
        expect(dist).toBeGreaterThan(200)  // fell away to floor
    })

    test('getTethers returns views with parent/child positions and length', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const parent = world.registerStatic({ x: 400, y: 0 }, { width: 40, height: 40 })
        const child = world.register({ x: 400, y: 200 }, { width: 80, height: 40 })
        const th = world.tether(parent, child, 200)
        const views = world.getTethers()
        expect(views).toHaveLength(1)
        expect(views[0]!.length).toBe(200)
        world.untether(th)
        expect(world.getTethers()).toHaveLength(0)
    })

    test('getTetherList returns a stable reference until the tether set changes', () => {
        // Required by useSyncExternalStore in StringLayer — a new reference on
        // every call causes an infinite re-render loop ("Maximum update depth exceeded").
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const parent = world.registerStatic({ x: 400, y: 0 }, { width: 40, height: 40 })
        const child = world.register({ x: 400, y: 200 }, { width: 80, height: 40 })

        const empty1 = world.getTetherList()
        const empty2 = world.getTetherList()
        expect(empty2).toBe(empty1)

        const th = world.tether(parent, child, 200)
        const withTether1 = world.getTetherList()
        expect(withTether1).not.toBe(empty1)
        expect(withTether1).toHaveLength(1)

        // Stable across calls when the set hasn't changed — even after world.tick advances positions
        for (let i = 0; i < 10; i++) world.tick(FIXED_DT_MS)
        const withTether2 = world.getTetherList()
        expect(withTether2).toBe(withTether1)

        world.untether(th)
        const afterUntether = world.getTetherList()
        expect(afterUntether).not.toBe(withTether1)
        expect(afterUntether).toHaveLength(0)
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
