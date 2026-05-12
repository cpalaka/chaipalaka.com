import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from '../../physics/PhysicsWorld'
import { pourInDrop } from './pourInDrop'

const FIXED_DT_MS = 1000 / 60

describe('pourInDrop (T2)', () => {
    test('spawns each card above the viewport at its layout x', () => {
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
                { id: 'b', layoutAnchor: { x: 500, y: 300 }, height: 120, staggerMs: 80 },
            ],
            { viewport },
        )

        step(0)
        const posA = world.getPosition(a)
        expect(posA.x).toBeCloseTo(200, 1)
        expect(posA.y).toBeLessThan(0)

        // b has stagger 80ms — has NOT spawned yet (still at original position)
        const posB = world.getPosition(b)
        expect(posB.x).toBeCloseTo(500, 1)
        expect(posB.y).toBeCloseTo(300, 1)
    })

    test('child spawns after parent based on staggerMs', () => {
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
                { id: 'b', layoutAnchor: { x: 500, y: 300 }, height: 120, staggerMs: 80 },
            ],
            { viewport },
        )

        step(0)
        // Advance past b's stagger threshold
        step(100)
        const posB = world.getPosition(b)
        expect(posB.y).toBeLessThan(0)
    })

    test('applies downward velocity on spawn', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const a = world.registerById(
            'a',
            { x: 200, y: 200 },
            { width: 240, height: 120 },
        )

        const step = pourInDrop(
            world,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 }],
            { viewport },
        )

        step(0)
        const spawnPos = world.getPosition(a)
        world.tick(FIXED_DT_MS)
        const afterTick = world.getPosition(a)
        // Card moved downward (positive y direction) in the first frame, confirming initial velocity.
        expect(afterTick.y).toBeGreaterThan(spawnPos.y)
    })

    test('resolves at hard ceiling when cards do not settle in time', () => {
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
})
