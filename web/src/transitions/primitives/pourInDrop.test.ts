import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from '../../physics/PhysicsWorld'
import { pourInDrop } from './pourInDrop'

const FIXED_DT_MS = 1000 / 60

describe('pourInDrop (T2 — kinematic tween)', () => {
    test('pre-spawns ALL entries above the viewport on first tick (regardless of stagger)', () => {
        // Prevents the cards from being briefly visible at their layout
        // positions during the stagger delay.
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const a = world.registerById(
            'a',
            { x: 200, y: 200 },
            { width: 240, height: 120 },
        )
        const b = world.registerById(
            'b',
            { x: 500, y: 300 },
            { width: 240, height: 120 },
        )

        const step = pourInDrop(
            world,
            [
                { id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 },
                { id: 'b', layoutAnchor: { x: 500, y: 300 }, height: 120, staggerMs: 1000 },
            ],
            { viewport, hardCeilingMs: 5000 },
        )

        step(0)
        const posA = world.getPosition(a)
        expect(posA.x).toBeCloseTo(200, 1)
        expect(posA.y).toBeLessThan(0)

        // b has stagger 1000ms but is still pre-spawned above viewport.
        const posB = world.getPosition(b)
        expect(posB.x).toBeCloseTo(500, 1)
        expect(posB.y).toBeLessThan(0)
    })

    test('tween for an entry only begins after its staggerMs has elapsed', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        world.registerById('a', { x: 200, y: 200 }, { width: 240, height: 120 })
        const b = world.registerById(
            'b',
            { x: 500, y: 300 },
            { width: 240, height: 120 },
        )

        const step = pourInDrop(
            world,
            [
                { id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 },
                { id: 'b', layoutAnchor: { x: 500, y: 300 }, height: 120, staggerMs: 200 },
            ],
            { viewport, hardCeilingMs: 5000 },
        )

        step(0)
        const bAfterPreSpawn = world.getPosition(b).y
        expect(bAfterPreSpawn).toBeLessThan(0)

        // Advance below b's stagger threshold — b should not have moved.
        step(50)
        expect(world.getPosition(b).y).toBeCloseTo(bAfterPreSpawn, 1)

        // Advance past b's stagger threshold — b's tween should now have started.
        step(200)
        expect(world.getPosition(b).y).toBeGreaterThan(bAfterPreSpawn)
    })

    test('tween moves the card from above viewport to its layout anchor', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const a = world.registerById(
            'a',
            { x: 200, y: 200 },
            { width: 240, height: 120 },
        )

        const tweenDurationMs = 600
        const step = pourInDrop(
            world,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 }],
            { viewport, tweenDurationMs, hardCeilingMs: 5000 },
        )

        // Spawn above viewport.
        step(0)
        const start = world.getPosition(a)
        expect(start.y).toBeLessThan(0)

        // Halfway through the tween — card should have moved meaningfully but
        // not yet landed at the anchor.
        step(tweenDurationMs / 2)
        const mid = world.getPosition(a)
        expect(mid.y).toBeGreaterThan(start.y)
        expect(mid.y).toBeLessThan(200)

        // Past the tween — final position equals layout anchor.
        step(tweenDurationMs)
        const end = world.getPosition(a)
        expect(end.x).toBeCloseTo(200, 1)
        expect(end.y).toBeCloseTo(200, 1)
    })

    test('captures the existing tether on start and re-wires it on finalize', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const a = world.registerById(
            'a',
            { x: 200, y: 200 },
            { width: 240, height: 120 },
        )
        world.tether(world.ceilingHandle, a, 200, { x: 200, y: 0 })
        expect(world.listTetherRecords()).toHaveLength(1)

        const tweenDurationMs = 200
        const step = pourInDrop(
            world,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 }],
            { viewport, tweenDurationMs, hardCeilingMs: 5000 },
        )

        // Start: tether is untethered for the duration of the tween.
        step(0)
        expect(world.listTetherRecords()).toHaveLength(0)

        // Finish the tween.
        step(tweenDurationMs)
        // Body is at its anchor, velocity zero, tether re-wired with same params.
        const after = world.listTetherRecords()
        expect(after).toHaveLength(1)
        expect(after[0]?.parent).toBe(world.ceilingHandle)
        expect(after[0]?.child).toBe(a)
        expect(after[0]?.length).toBe(200)
        const v = world.getVelocity(a)
        expect(Math.hypot(v.x, v.y)).toBeCloseTo(0, 5)
    })

    test('resolves at hard ceiling when the tween cannot complete in time', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        world.registerById('a', { x: 200, y: 200 }, { width: 240, height: 120 })

        const step = pourInDrop(
            world,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 }],
            { viewport, hardCeilingMs: 100 },
        )

        let elapsed = 0
        let done = false
        while (!done && elapsed < 200) {
            done = step(FIXED_DT_MS)
            elapsed += FIXED_DT_MS
        }
        expect(done).toBe(true)
        expect(elapsed).toBeGreaterThanOrEqual(100)
    })

    test('hard-ceiling fallback restores tethers for entries that never started', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const a = world.registerById(
            'a',
            { x: 200, y: 200 },
            { width: 240, height: 120 },
        )
        world.tether(world.ceilingHandle, a, 200, { x: 200, y: 0 })

        // staggerMs is past the hard ceiling — the entry should never start
        // its tween, but the primitive must still leave the world in a valid
        // state (tether intact, body unstuck).
        const step = pourInDrop(
            world,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 500 }],
            { viewport, hardCeilingMs: 100 },
        )

        let elapsed = 0
        let done = false
        while (!done && elapsed < 200) {
            done = step(FIXED_DT_MS)
            elapsed += FIXED_DT_MS
        }
        expect(done).toBe(true)
        // Tether should still be there (or have been re-wired).
        expect(world.listTetherRecords()).toHaveLength(1)
    })
})
