import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from './PhysicsWorld'
import { physicsTuning } from './physicsTuning'
import { driftTuning } from './driftTuning'

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

    test('a mid-simulation physicsTuning.gravityY change affects the next tick', () => {
        // Read-at-use: the world must read physicsTuning.gravityY per tick,
        // never capture it at construction — this is what makes a dev slider
        // act on a running world.
        const original = physicsTuning.gravityY
        try {
            const world = new PhysicsWorld({
                viewport: { width: 800, height: 6000 },
            })
            const handle = world.registerById(
                'a',
                { x: 100, y: 100 },
                { width: 100, height: 50 },
            )
            // Fall under the baseline gravity for a few ticks, then measure
            // one tick's displacement.
            for (let i = 0; i < 10; i++) world.tick(FIXED_DT_MS)
            const before = world.getPosition(handle).y
            world.tick(FIXED_DT_MS)
            const baselineStep = world.getPosition(handle).y - before

            // Kill gravity mid-simulation. The very next tick must show a
            // smaller displacement (velocity persists; acceleration stops).
            physicsTuning.gravityY = 0
            const at = world.getPosition(handle).y
            world.tick(FIXED_DT_MS)
            const zeroGStep = world.getPosition(handle).y - at
            expect(zeroGStep).toBeLessThan(baselineStep)
            expect(world.getGravityVector().y).toBe(0)
        } finally {
            physicsTuning.gravityY = original
        }
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
    // edgeAttachPoint clamps ceiling/floor tethers against the registration's
    // width + anchor; setViewport must refresh those or a card near the new edge
    // wires diagonally to a stale extent after a resize.
    test('setViewport refreshes ceiling/floor registration width + anchor', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        world.setViewport({ width: 1600, height: 900 })
        expect(world.getSize(world.ceilingHandle).width).toBe(1600)
        expect(world.getAnchor(world.ceilingHandle).x).toBeCloseTo(800)
        expect(world.getAnchor(world.ceilingHandle).y).toBeCloseTo(0)
        expect(world.getSize(world.floorHandle).width).toBe(1600)
        expect(world.getAnchor(world.floorHandle).x).toBeCloseTo(800)
        expect(world.getAnchor(world.floorHandle).y).toBeCloseTo(900)
    })

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

// A small deterministic PRNG so drift tests are reproducible (Math.random is
// injectable via the `rng` option).
function mulberry32(seed: number): () => number {
    let a = seed >>> 0
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

// The drift knobs are a read-at-use module singleton (driftTuning.ts). Run-and-
// tumble tests tune the firing rate so an impulse reliably fires — or never
// fires — within the tick window: a short `impulseIntervalMs` to exercise
// wander, a huge one to isolate prose repel. Overrides are restored after.
function withDriftTuning(
    overrides: Partial<typeof driftTuning>,
    fn: () => void,
): void {
    const saved = { ...driftTuning }
    Object.assign(driftTuning, overrides)
    try {
        fn()
    } finally {
        Object.assign(driftTuning, saved)
    }
}

describe('PhysicsWorld drift mode', () => {
    // AC#2 — no mode declared ⇒ the app resolves drift; drift runs zero gravity.
    test('drift mode runs zero engine gravity', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
            mode: 'drift',
        })
        expect(world.getGravityVector()).toEqual({ x: 0, y: 0 })
    })

    test('driftScale 0 ⇒ a body does not fall (proves zero gravity)', () => {
        const world = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
            mode: 'drift',
            rng: mulberry32(3),
        })
        world.setDriftScale(0)
        const h = world.registerById('a', { x: 400, y: 100 }, { width: 100, height: 60 })
        for (let i = 0; i < 120; i++) world.tick(FIXED_DT_MS)
        const p = world.getPosition(h)
        expect(Math.abs(p.y - 100)).toBeLessThan(1)
        expect(Math.abs(p.x - 400)).toBeLessThan(1)
    })

    test('drift active ⇒ a body wanders as impulses fire', () => {
        withDriftTuning({ impulseIntervalMs: 100 }, () => {
            const world = new PhysicsWorld({
                viewport: { width: 800, height: 600 },
                mode: 'drift',
                rng: mulberry32(1),
            })
            const h = world.registerById('a', { x: 400, y: 300 }, { width: 100, height: 60 })
            for (let i = 0; i < 120; i++) world.tick(FIXED_DT_MS)
            const p = world.getPosition(h)
            expect(Math.hypot(p.x - 400, p.y - 300)).toBeGreaterThan(1)
        })
    })

    // AC#4 — driftScale scales the impulse speed (hence wander amplitude); the
    // same seed fires the same impulses at both scales, so displacement scales
    // linearly (no collisions/walls/repel in the huge empty viewport).
    test('driftScale scales wander amplitude linearly', () => {
        const run = (scale: number) => {
            let d = 0
            withDriftTuning({ impulseIntervalMs: 100 }, () => {
                const w = new PhysicsWorld({
                    viewport: { width: 4000, height: 4000 },
                    mode: 'drift',
                    rng: mulberry32(7),
                })
                const h = w.registerById('a', { x: 2000, y: 2000 }, { width: 100, height: 60 })
                w.setDriftScale(scale)
                for (let i = 0; i < 60; i++) w.tick(FIXED_DT_MS)
                const p = w.getPosition(h)
                d = Math.hypot(p.x - 2000, p.y - 2000)
            })
            return d
        }
        const ratio = run(2) / run(1)
        expect(ratio).toBeGreaterThan(1.8)
        expect(ratio).toBeLessThan(2.2)
    })

    test('driftScale defaults to 1 (a fresh drift world already wanders)', () => {
        withDriftTuning({ impulseIntervalMs: 100 }, () => {
            const w = new PhysicsWorld({
                viewport: { width: 800, height: 600 },
                mode: 'drift',
                rng: mulberry32(9),
            })
            const h = w.registerById('a', { x: 400, y: 300 }, { width: 100, height: 60 })
            for (let i = 0; i < 120; i++) w.tick(FIXED_DT_MS)
            const p = w.getPosition(h)
            expect(Math.hypot(p.x - 400, p.y - 300)).toBeGreaterThan(1)
        })
    })

    // AC#5 — damping, both halves.
    test('registers frictionAir per mode (drift damping vs 0.005 gravity)', () => {
        const drift = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
            mode: 'drift',
        })
        const hd = drift.registerById('a', { x: 1, y: 1 }, { width: 100, height: 60 })
        expect(drift.getFrictionAir(hd)).toBeCloseTo(driftTuning.damping)

        const grav = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
            mode: 'gravity',
        })
        const hg = grav.registerById('a', { x: 1, y: 1 }, { width: 100, height: 60 })
        expect(grav.getFrictionAir(hg)).toBeCloseTo(0.005)
    })

    test('setMode re-applies frictionAir to existing bodies (dormant stays 0.005)', () => {
        const w = new PhysicsWorld({ viewport: { width: 800, height: 600 }, mode: 'gravity' })
        const h = w.registerById('a', { x: 1, y: 1 }, { width: 100, height: 60 })
        expect(w.getFrictionAir(h)).toBeCloseTo(0.005)
        w.setMode('drift')
        expect(w.getFrictionAir(h)).toBeCloseTo(driftTuning.damping)
        w.setMode('gravity')
        expect(w.getFrictionAir(h)).toBeCloseTo(0.005)
    })

    test('the drift tick re-syncs frictionAir from driftTuning (HMR)', () => {
        const w = new PhysicsWorld({ viewport: { width: 800, height: 600 }, mode: 'drift' })
        const h = w.registerById('a', { x: 400, y: 300 }, { width: 100, height: 60 })
        const orig = driftTuning.damping
        try {
            driftTuning.damping = 0.033
            w.tick(FIXED_DT_MS)
            expect(w.getFrictionAir(h)).toBeCloseTo(0.033)
        } finally {
            driftTuning.damping = orig
        }
    })

    // Guard the matter NaN-inversion footgun: an S4/HMR mis-tune of the damping
    // knob must not flip frictionAir past the drag-inversion ceiling and NaN the
    // world (reference_matter_js_frictionair_inversion).
    test('the drift tick clamps frictionAir below the NaN-inversion ceiling', () => {
        const w = new PhysicsWorld({ viewport: { width: 800, height: 600 }, mode: 'drift' })
        const h = w.registerById('a', { x: 400, y: 300 }, { width: 100, height: 60 })
        const orig = driftTuning.damping
        try {
            driftTuning.damping = 0.9 // above the ~0.667 inversion threshold
            w.tick(FIXED_DT_MS)
            expect(w.getFrictionAir(h)).toBeLessThanOrEqual(0.6)
            const p = w.getPosition(h)
            expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true)
        } finally {
            driftTuning.damping = orig
        }
    })

    // AC#8 — word-anchor proxies are sensors.
    test('word-anchor proxy is a sensor and emits no collision impulse', () => {
        const w = new PhysicsWorld({ viewport: { width: 800, height: 600 }, mode: 'drift' })
        const proxy = w.registerAnchor({ x: 400, y: 300 })
        expect(w.isSensor(proxy)).toBe(true)
        const card = w.registerById('c', { x: 400, y: 300 }, { width: 100, height: 60 })
        w.setDriftScale(0) // isolate: any motion would be a collision shove
        for (let i = 0; i < 10; i++) w.tick(FIXED_DT_MS)
        const p = w.getPosition(card)
        expect(Math.hypot(p.x - 400, p.y - 300)).toBeLessThan(0.5)
    })

    // Spec §1 — dismissed previews (dynamic sensors: PreviewCard.setSensor) get
    // "no Brownian, no repel". The drift pass must skip every dynamic sensor,
    // not just static bodies.
    test('drift pass skips dynamic sensors (dismissed-preview exclusion)', () => {
        withDriftTuning({ impulseIntervalMs: 100 }, () => {
            const w = new PhysicsWorld({
                viewport: { width: 800, height: 600 },
                mode: 'drift',
                rng: mulberry32(4),
            })
            const sensor = w.registerById('s', { x: 400, y: 300 }, { width: 100, height: 60 })
            w.setSensor(sensor, true)
            const solid = w.registerById('c', { x: 200, y: 300 }, { width: 100, height: 60 })
            for (let i = 0; i < 120; i++) w.tick(FIXED_DT_MS)
            // The non-sensor body wanders; the sensor is skipped before its
            // impulse timer decrements, so it never fires and stays put.
            const ps = w.getPosition(solid)
            expect(Math.hypot(ps.x - 200, ps.y - 300)).toBeGreaterThan(1)
            const px = w.getPosition(sensor)
            expect(Math.hypot(px.x - 400, px.y - 300)).toBeLessThan(0.5)
        })
    })

    // Spec §1 — the drift pass never clamps a body's authored velocity. A
    // drag-release fling / dismissal kick above the old maxSpeed=8 must survive
    // (was clamped to 8 px/tick, deadening every fling).
    test('drift pass does not clamp an authored fling velocity', () => {
        const w = new PhysicsWorld({
            viewport: { width: 4000, height: 4000 },
            mode: 'drift',
            rng: mulberry32(6),
        })
        const h = w.registerById('a', { x: 2000, y: 2000 }, { width: 100, height: 60 })
        w.setVelocity(h, { x: 32, y: 0 }) // ~2px/ms drag at flingVelocityScale 16
        w.tick(FIXED_DT_MS)
        const v = w.getVelocity(h)
        // Only damping (≈0.01) touches it (default 15000ms interval ⇒ no impulse
        // fires on tick 1) — not a cap to 8.
        expect(Math.hypot(v.x, v.y)).toBeGreaterThan(25)
    })

    // AC#9 — drift-mode anchor move translate-pairs; gravity teleports + zeroes.
    // A short interval builds a real wander offset + velocity to preserve.
    test('drift setAnchor translate-pairs (preserves wander offset + velocity)', () => {
        withDriftTuning({ impulseIntervalMs: 100 }, () => {
            const w = new PhysicsWorld({
                viewport: { width: 4000, height: 4000 },
                mode: 'drift',
                rng: mulberry32(5),
            })
            const h = w.registerById('a', { x: 2000, y: 2000 }, { width: 100, height: 60 })
            for (let i = 0; i < 15; i++) w.tick(FIXED_DT_MS)
            const posBefore = w.getPosition(h)
            const velBefore = w.getVelocity(h)
            const offset = { x: posBefore.x - 2000, y: posBefore.y - 2000 }
            w.setAnchor(h, { x: 2300, y: 2400 })
            const posAfter = w.getPosition(h)
            const velAfter = w.getVelocity(h)
            expect(posAfter.x).toBeCloseTo(2300 + offset.x, 6)
            expect(posAfter.y).toBeCloseTo(2400 + offset.y, 6)
            expect(velAfter.x).toBeCloseTo(velBefore.x, 6)
            expect(velAfter.y).toBeCloseTo(velBefore.y, 6)
        })
    })

    test('gravity setAnchor teleports to the anchor and zeroes velocity', () => {
        const w = new PhysicsWorld({
            viewport: { width: 4000, height: 4000 },
            mode: 'gravity',
        })
        const h = w.registerById('a', { x: 2000, y: 2000 }, { width: 100, height: 60 })
        w.setVelocity(h, { x: 5, y: 5 })
        w.setAnchor(h, { x: 2300, y: 2400 })
        const p = w.getPosition(h)
        expect(p.x).toBeCloseTo(2300, 6)
        expect(p.y).toBeCloseTo(2400, 6)
        expect(w.getVelocity(h)).toEqual({ x: 0, y: 0 })
    })

    // AC#3 — invariance suite.
    test('deterministic under an injected RNG (same seed ⇒ same path)', () => {
        const run = () => {
            let p = { x: 0, y: 0, rotation: 0 }
            withDriftTuning({ impulseIntervalMs: 100 }, () => {
                const w = new PhysicsWorld({
                    viewport: { width: 4000, height: 4000 },
                    mode: 'drift',
                    rng: mulberry32(11),
                })
                const h = w.registerById('a', { x: 2000, y: 2000 }, { width: 100, height: 60 })
                for (let i = 0; i < 50; i++) w.tick(FIXED_DT_MS)
                p = w.getPosition(h)
            })
            return p
        }
        expect(run()).toEqual(run())
    })

    test('drift impulse is mass-invariant (same seed, 16× area ⇒ same path)', () => {
        const run = (size: number) => {
            let p = { x: 0, y: 0, rotation: 0 }
            withDriftTuning({ impulseIntervalMs: 100 }, () => {
                const w = new PhysicsWorld({
                    viewport: { width: 8000, height: 8000 },
                    mode: 'drift',
                    rng: mulberry32(13),
                })
                const h = w.registerById('a', { x: 4000, y: 4000 }, { width: size, height: size })
                for (let i = 0; i < 40; i++) w.tick(FIXED_DT_MS)
                p = w.getPosition(h)
            })
            return p
        }
        const small = run(40)
        const big = run(160)
        expect(big.x).toBeCloseTo(small.x, 5)
        expect(big.y).toBeCloseTo(small.y, 5)
    })

    test('prose repel is mass-invariant', () => {
        const run = (size: number) => {
            let p = { x: 0, y: 0, rotation: 0 }
            // Huge interval ⇒ no run-and-tumble impulse fires in-window, so only
            // repel moves the card. (rng()=0.5 no longer zeroes the impulse under
            // run-and-tumble — it is a real π-direction kick — so a huge interval
            // isolates repel instead. See reference_drift_repel_driftscale_gated.)
            withDriftTuning({ impulseIntervalMs: 1e9 }, () => {
                const w = new PhysicsWorld({
                    viewport: { width: 4000, height: 4000 },
                    mode: 'drift',
                    rng: () => 0.5,
                })
                w.setContentBox({ x: 1800, y: 1800, width: 400, height: 400 })
                const h = w.registerById('a', { x: 2000, y: 2000 }, { width: size, height: size })
                for (let i = 0; i < 30; i++) w.tick(FIXED_DT_MS)
                p = w.getPosition(h)
            })
            return p
        }
        const small = run(40)
        const big = run(160)
        expect(big.x).toBeCloseTo(small.x, 4)
        expect(big.y).toBeCloseTo(small.y, 4)
    })

    // AC#10 / D8 — repel is BINARY-gated by driftScale (Chai 2026-07-03), not
    // ∝ it: reduced-motion (driftScale 0) stills repel, but any nonzero drift
    // gives FULL repel. This decouples "hold cards clear of the prose" from
    // "how lively the drift is", so a low-drift reading route still holds its
    // cards off the prose (task-042.01 re-review L1: spec §1 scales only wander).
    test('prose repel is binary-gated by driftScale (0 stills; any nonzero = full)', () => {
        const near = { x: 2000, y: 1750 } // 50px above the box top edge (< repelRadius)
        const run = (scale: number) => {
            let p = { x: 0, y: 0, rotation: 0 }
            // Huge interval ⇒ no impulse fires, isolating repel from wander at any
            // driftScale (rng()=0.5 no longer zeroes the impulse under run-and-tumble).
            withDriftTuning({ impulseIntervalMs: 1e9 }, () => {
                const w = new PhysicsWorld({
                    viewport: { width: 4000, height: 4000 },
                    mode: 'drift',
                    rng: () => 0.5,
                })
                w.setContentBox({ x: 1800, y: 1800, width: 400, height: 400 })
                const h = w.registerById('a', near, { width: 60, height: 60 })
                w.setDriftScale(scale)
                for (let i = 0; i < 30; i++) w.tick(FIXED_DT_MS)
                p = w.getPosition(h)
            })
            return p
        }
        // driftScale 0 ⇒ repel off: the card stays exactly where it loaded.
        const still = run(0)
        expect(Math.hypot(still.x - near.x, still.y - near.y)).toBeLessThan(0.5)
        // Any nonzero driftScale ⇒ full repel: a low-drift reading route (0.25)
        // is pushed off the edge exactly as hard as a lively one (1.0).
        const low = run(0.25)
        const high = run(1)
        expect(low.y).toBeLessThan(near.y - 1) // pushed outward (−y)
        expect(low.y).toBeCloseTo(high.y, 4) // same push regardless of scale
        expect(low.x).toBeCloseTo(high.x, 4)
    })

    test('impulse displacement is dt-invariant (8ms vs 33ms)', () => {
        // Run-and-tumble timing is ms-based, so over a fixed wall-clock window the
        // impulse count (≈ T/interval) and each glide's distance (v0/damping,
        // dt-invariant at constant dt) match across refresh rates. Params pick a
        // fast-settling glide + a non-overlapping interval so the window holds
        // whole random-walk steps; RMS displacement matches within a loose band.
        const warn = console.warn
        console.warn = () => {} // matter warns once per dt > 16.667ms (the 33ms tick)
        const rmsOver = (dt: number) => {
            const T = 8000
            const ticks = Math.round(T / dt)
            const N = 60
            let sumSq = 0
            for (let k = 0; k < N; k++) {
                const w = new PhysicsWorld({
                    viewport: { width: 20000, height: 20000 },
                    mode: 'drift',
                    rng: mulberry32(100 + k),
                })
                const h = w.registerById('a', { x: 10000, y: 10000 }, { width: 60, height: 60 })
                for (let i = 0; i < ticks; i++) w.tick(dt)
                const p = w.getPosition(h)
                sumSq += (p.x - 10000) ** 2 + (p.y - 10000) ** 2
            }
            return Math.sqrt(sumSq / N)
        }
        let ratio = 0
        withDriftTuning({ impulseIntervalMs: 800, damping: 0.2 }, () => {
            ratio = rmsOver(8) / rmsOver(33)
        })
        console.warn = warn
        expect(ratio).toBeGreaterThan(0.6)
        expect(ratio).toBeLessThan(1.6)
    })

    test('non-positive-dt frames are dropped before any work (0-dt matter guard)', () => {
        // A browser feeds occasional 0-dt frames (two rAF in one millisecond);
        // matter's Verlet solve on a 0-dt frame poisons drift bodies to NaN
        // (verified in-browser — node's Engine.update(0) is a harmless no-op, so
        // the NaN itself is not node-reproducible). This pins the guard's
        // contract: a dt ≤ 0 tick runs nothing at all.
        const w = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
            mode: 'drift',
        })
        let ran = 0
        w.onBeforeTick(() => {
            ran++
        })
        w.tick(FIXED_DT_MS)
        expect(ran).toBe(1) // a real frame runs
        w.tick(0)
        w.tick(-5)
        expect(ran).toBe(1) // 0 and negative frames are dropped before any work
    })

    test('drift-settle: displacement + speed stay bounded, never NaN', () => {
        const w = new PhysicsWorld({
            viewport: { width: 800, height: 600 },
            mode: 'drift',
            rng: mulberry32(21),
        })
        const h = w.registerById('a', { x: 400, y: 300 }, { width: 100, height: 60 })
        let maxDisp = 0
        let maxSpeed = 0
        for (let i = 0; i < 2000; i++) {
            w.tick(FIXED_DT_MS)
            const p = w.getPosition(h)
            const v = w.getVelocity(h)
            expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true)
            maxDisp = Math.max(maxDisp, Math.hypot(p.x - 400, p.y - 300))
            maxSpeed = Math.max(maxSpeed, Math.hypot(v.x, v.y))
        }
        // Bounded-drift invariant: the card wanders but never escapes its region
        // (walls + damping bound it) and never NaNs. The old maxSpeed clamp is
        // gone — the dt-clamp + damping bound the impulse glides, so the speed
        // assertion is a loose runaway/NaN-inversion sanity ceiling (a glide peaks
        // at ~impulseSpeed), NOT a velocity cap on authored motion.
        expect(Number.isFinite(maxSpeed)).toBe(true)
        expect(maxSpeed).toBeLessThan(50)
        expect(maxDisp).toBeLessThan(600)
    })
})
