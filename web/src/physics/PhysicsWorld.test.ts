import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from './PhysicsWorld'

const FIXED_DT_MS = 1000 / 60

describe('PhysicsWorld registration', () => {
    test('register returns a handle that can be unregistered', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'a',
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
        const handle = world.registerById(
            'a',
            { x: 250, y: 175 },
            { width: 100, height: 50 },
        )
        const pos = world.getPosition(handle)
        expect(pos.x).toBeCloseTo(250, 5)
        expect(pos.y).toBeCloseTo(175, 5)
    })

    test('setVelocity moves the body in the velocity direction on the next tick', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'a',
            { x: 100, y: 100 },
            { width: 100, height: 50 },
        )
        world.setVelocity(handle, { x: 5, y: 0 })
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
        const handle = world.registerById(
            'a',
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
        const handle = world.registerById(
            'a',
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
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'a',
            { x: 400, y: 200 },
            { width: 80, height: 40 },
        )
        world.setGravityDirection('down')
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        expect(world.getPosition(handle).y).toBeGreaterThan(200)
    })

    test('setGravityDirection("up") makes a body rise in negative y', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'a',
            { x: 400, y: 400 },
            { width: 80, height: 40 },
        )
        world.setGravityDirection('up')
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        expect(world.getPosition(handle).y).toBeLessThan(400)
    })

    test('setGravityDirection("left") makes a body drift in negative x', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'a',
            { x: 400, y: 300 },
            { width: 80, height: 40 },
        )
        world.setGravityDirection('left')
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        expect(world.getPosition(handle).x).toBeLessThan(400)
    })

    test('setGravityDirection("right") makes a body drift in positive x', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'a',
            { x: 400, y: 300 },
            { width: 80, height: 40 },
        )
        world.setGravityDirection('right')
        for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
        expect(world.getPosition(handle).x).toBeGreaterThan(400)
    })

    test('getGravityVector returns direction and non-zero magnitude', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
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
        const handle = world.registerById(
            'a',
            { x: 400, y: 400 },
            { width: 80, height: 40 },
        )
        world.setGravityDirection('up')
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        // ceiling is near y=0; body should be stopped by it, not escaping to negative y
        expect(pos.y).toBeGreaterThanOrEqual(0)
    })
})

describe('PhysicsWorld setViewport', () => {
    test('setViewport repositions floor so new floor catches a falling body', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'a',
            { x: 400, y: 50 },
            { width: 80, height: 40 },
        )
        world.setViewport({ width: 800, height: 200 })
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.y).toBeLessThanOrEqual(200)
    })

    test('top inset at construction: ceiling stops upward-rising body at or below inset y', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
            insets: { top: 40, bottom: 0 },
        })
        const handle = world.registerById(
            'a',
            { x: 400, y: 400 },
            { width: 80, height: 40 },
        )
        world.setGravityDirection('up')
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.y).toBeGreaterThanOrEqual(40)
    })

    test('bottom inset at construction: floor catches a falling body above viewport bottom', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 400 },
            insets: { top: 0, bottom: 40 },
        })
        const handle = world.registerById(
            'a',
            { x: 400, y: 50 },
            { width: 80, height: 40 },
        )
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.y).toBeLessThanOrEqual(360)
    })

    test('setViewport with top inset repositions ceiling so rising body stops at inset y', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'a',
            { x: 400, y: 400 },
            { width: 80, height: 40 },
        )
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
        const handle = world.registerById(
            'a',
            { x: 100, y: 100 },
            { width: 100, height: 50 },
        )
        world.setVelocity(handle, { x: 20, y: 0 })
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
        world.registerById(
            'a',
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
        const handle = world.registerById(
            'a',
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
        const handle = world.registerById(
            'a',
            { x: 400, y: 100 },
            { width: 100, height: 50 },
        )
        world.setVelocity(handle, { x: 5, y: 0 })
        world.tick(FIXED_DT_MS)
        const pos = world.getPosition(handle)
        expect(pos.x).toBeGreaterThan(401)
    })

    test('after release, setVelocity adds velocity to a body that was dragged', () => {
        const release = (velX: number) => {
            const world = new PhysicsWorld({
                viewport: { width: 800, height: 600 },
            })
            const handle = world.registerById(
                'a',
                { x: 100, y: 100 },
                { width: 100, height: 50 },
            )
            world.setDragging(handle, true)
            world.setPosition(handle, { x: 200, y: 100 })
            world.setDragging(handle, false)
            if (velX !== 0) world.setVelocity(handle, { x: velX, y: 0 })
            world.tick(FIXED_DT_MS)
            return world.getPosition(handle).x
        }
        expect(release(5)).toBeGreaterThan(release(0))
    })
})

describe('PhysicsWorld registerById', () => {
    test('registerById makes card retrievable by id', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'hero',
            { x: 100, y: 100 },
            { width: 80, height: 40 },
        )
        expect(world.getHandleById('hero')).toBe(handle)
    })

    test('registerById with duplicate id throws', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        world.registerById(
            'card-1',
            { x: 100, y: 100 },
            { width: 80, height: 40 },
        )
        expect(() =>
            world.registerById(
                'card-1',
                { x: 200, y: 200 },
                { width: 80, height: 40 },
            ),
        ).toThrow()
    })

    test('unregister removes the id from the id map', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'card-1',
            { x: 100, y: 100 },
            { width: 80, height: 40 },
        )
        world.unregister(handle)
        expect(world.getHandleById('card-1')).toBeUndefined()
    })

    test('getHandleById returns undefined for unknown id', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        expect(world.getHandleById('missing')).toBeUndefined()
    })
})

describe('PhysicsWorld setBuoyancy', () => {
    test('balloon card is lifted against default downward gravity relative to heavy card', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const heavy = world.registerById(
            'heavy',
            { x: 400, y: 300 },
            { width: 80, height: 40 },
        )
        const balloon = world.registerById(
            'balloon',
            { x: 400, y: 300 },
            { width: 80, height: 40 },
        )
        world.setBuoyancy(balloon, 'balloon')
        for (let i = 0; i < 60; i++) world.tick(FIXED_DT_MS)
        const heavyPos = world.getPosition(heavy)
        const balloonPos = world.getPosition(balloon)
        expect(balloonPos.y).toBeLessThan(heavyPos.y)
    })

    test('setBuoyancy throws for unknown handle', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        expect(() => world.setBuoyancy(999, 'balloon')).toThrow()
    })
})

describe('PhysicsWorld getSize', () => {
    test('getSize returns initial registered dimensions', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'sized',
            { x: 200, y: 200 },
            { width: 100, height: 50 },
        )
        expect(world.getSize(handle)).toEqual({ width: 100, height: 50 })
    })
})

describe('PhysicsWorld static anchors', () => {
    test('getAnchor returns the registered surface point for ceiling and floor', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        // ceiling registered anchor is the top surface (y = 0 with no insets); floor is bottom surface
        const ceiling = world.getAnchor(world.ceilingHandle)
        expect(ceiling).toEqual({ x: 400, y: 0 })
        const floor = world.getAnchor(world.floorHandle)
        expect(floor).toEqual({ x: 400, y: 600 })
    })
})

describe('PhysicsWorld tether integration (rope force end-to-end)', () => {
    // Unit-level rope-force coverage lives in Tether.test.ts (no matter.js).
    // These two integration smokes verify the wiring from PhysicsWorld.tick()
    // → Tether.applyRopeForces() → matter.js solver behaves identically to the
    // pre-extraction inline loop (settle position + anchorA hold).

    test('body stretched past tether length is pulled back and settles near tether length', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const ceilingPos = world.getPosition(world.ceilingHandle)
        const child = world.registerById(
            'stretched',
            { x: 400, y: 300 },
            { width: 80, height: 40 },
        )
        // child is 330 units below ceiling body centre; tether length 50 → heavy stretch
        world.tether.add(world.ceilingHandle, child, 50, {
            x: 0,
            y: 0 - ceilingPos.y,
        })
        for (let i = 0; i < 300; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(child)
        const dist = Math.hypot(pos.x - 400, pos.y - 0)
        expect(dist).toBeLessThan(100)
    })

    test('tether with anchorA holds the child near the offset world point under gravity', () => {
        // Without anchorA, the rope anchors at the ceiling body centre (400, -30)
        // and the child would drift right toward x=400. With anchorA, the rope hangs
        // straight from (200, 0); x stays near 200.
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const ceilingPos = world.getPosition(world.ceilingHandle)
        const child = world.registerById(
            'anchored',
            { x: 200, y: 150 },
            { width: 80, height: 40 },
        )
        world.tether.add(world.ceilingHandle, child, 150, {
            x: 200 - ceilingPos.x,
            y: 0 - ceilingPos.y,
        })
        for (let i = 0; i < 300; i++) world.tick(FIXED_DT_MS)
        const pos = world.getPosition(child)
        expect(Math.abs(pos.x - 200)).toBeLessThan(20)
        expect(pos.y).toBeGreaterThan(150)
        expect(pos.y).toBeLessThan(220)
    })
})

describe('PhysicsWorld setSensor', () => {
    test('setSensor throws for an unknown handle', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        expect(() => world.setSensor(999, true)).toThrow()
    })

    test('setSensor does not throw for a valid handle', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
        })
        const handle = world.registerById(
            'sensor',
            { x: 100, y: 100 },
            { width: 80, height: 40 },
        )
        expect(() => world.setSensor(handle, true)).not.toThrow()
        expect(() => world.setSensor(handle, false)).not.toThrow()
    })
})
