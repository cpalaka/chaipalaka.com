import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from '../../physics/PhysicsWorld'
import { anchorSlide } from './anchorSlide'

describe('anchorSlide (T3) — horizontal', () => {
    test('translates from-card horizontally off-viewport over duration', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const a = world.registerById(
            'a',
            { x: 400, y: 300 },
            { width: 200, height: 100 },
        )

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            {
                axis: 'horizontal',
                sign: 1,
                durationMs: 700,
                viewport,
            },
        )

        step(0) // captures initial positions
        const start = world.getPosition(a)
        expect(start.x).toBeCloseTo(400, 1)

        // Halfway through duration
        step(350)
        const mid = world.getPosition(a)
        // sign=+1, fromCard exits in axis × -sign direction = leftward (negative x)
        expect(mid.x).toBeLessThan(start.x)

        // After full duration
        const done = step(350)
        expect(done).toBe(true)
        const final = world.getPosition(a)
        // Final position is off-viewport on the leftward side
        expect(final.x).toBeLessThanOrEqual(-100)
    })

    test('sign=-1 flips direction (from-card exits to the right)', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const a = world.registerById(
            'a',
            { x: 400, y: 300 },
            { width: 200, height: 100 },
        )

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            {
                axis: 'horizontal',
                sign: -1,
                durationMs: 700,
                viewport,
            },
        )

        step(0)
        step(700)
        const final = world.getPosition(a)
        // With sign=-1, fromCard exits in axis × -sign = rightward (positive x)
        expect(final.x).toBeGreaterThan(viewport.width)
    })

    test('to-card enters from origin side toward its layout position', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const b = world.registerById(
            'b',
            { x: 400, y: 300 },
            { width: 200, height: 100 },
        )

        const step = anchorSlide(
            world,
            { fromIds: [], toIds: ['b'] },
            {
                axis: 'horizontal',
                sign: 1,
                durationMs: 700,
                viewport,
            },
        )

        step(0)
        // toCard with sign=+1: enters from origin side (left) — initial position pushed off-screen left
        const initialPos = world.getPosition(b)
        expect(initialPos.x).toBeLessThanOrEqual(-100)

        // At end, reaches its layout position
        step(700)
        const final = world.getPosition(b)
        expect(final.x).toBeCloseTo(400, 1)
    })

    test('follows ease-out-cubic curve (front-loaded motion)', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const a = world.registerById(
            'a',
            { x: 400, y: 300 },
            { width: 200, height: 100 },
        )

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            {
                axis: 'horizontal',
                sign: 1,
                durationMs: 1000,
                viewport,
            },
        )

        step(0)
        const start = world.getPosition(a).x
        step(250) // t=0.25
        const at25 = world.getPosition(a).x
        step(250) // t=0.50
        const at50 = world.getPosition(a).x

        // Distance from start at t=0.5 — eased value at 0.5 is 1 - (1-0.5)^3 = 1 - 0.125 = 0.875
        const totalDistance = Math.abs(start - (start - (viewport.width + 200)))
        const distance25 = Math.abs(start - at25)
        const distance50 = Math.abs(start - at50)
        // Eased at t=0.25 → 1 - (0.75)^3 ≈ 0.578 — more than half of 0.875
        expect(distance25 / distance50).toBeGreaterThan(0.5)
        // And the 0.25-progress is much more than linear 0.25 (which would give 0.25/0.5 = 0.5)
        expect(distance25 / totalDistance).toBeGreaterThan(0.4)
    })

    test('handles empty from/to lists without error', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })

        const step = anchorSlide(
            world,
            { fromIds: [], toIds: [] },
            {
                axis: 'horizontal',
                sign: 1,
                durationMs: 100,
                viewport,
            },
        )

        step(0)
        const done = step(100)
        expect(done).toBe(true)
    })
})
