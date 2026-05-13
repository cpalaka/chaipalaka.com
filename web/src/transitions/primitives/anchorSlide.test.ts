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
        // toCard with sign=+1 horizontal: enters from the RIGHT (the opposite
        // side of the from-card's exit direction) — both cards slide left
        // together as a unified strip.
        const initialPos = world.getPosition(b)
        expect(initialPos.x).toBeGreaterThanOrEqual(viewport.width)

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

    test('to-card tether is captured on init and restored on completion', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const b = world.registerById(
            'b',
            { x: 400, y: 300 },
            { width: 200, height: 100 },
        )
        const TETHER_LEN = 250
        world.tether.add(world.ceilingHandle, b, TETHER_LEN)
        expect(
            world.tether.records().filter((t) => t.child === b),
        ).toHaveLength(1)

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

        // After step(0), the tether should be detached so StringLayer
        // doesn't draw a long diagonal string while the card slides in.
        step(0)
        expect(
            world.tether.records().filter((t) => t.child === b),
        ).toHaveLength(0)

        // After completion, the tether should be re-attached with the
        // original length so the card resumes hanging at its layout anchor.
        step(700)
        const restored = world.tether.records().filter((t) => t.child === b)
        expect(restored).toHaveLength(1)
        expect(restored[0]!.length).toBe(TETHER_LEN)
        expect(restored[0]!.parent).toBe(world.ceilingHandle)
    })

    test('vertical axis: from-card exits along axis × -sign', () => {
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
                axis: 'vertical',
                sign: 1,
                durationMs: 700,
                viewport,
            },
        )

        step(0)
        const start = world.getPosition(a)
        step(700)
        const final = world.getPosition(a)
        // sign=+1 vertical → from-card exits upward (y decreases)
        expect(final.y).toBeLessThan(start.y)
        expect(final.y).toBeLessThan(-50)
    })

    test('vertical sign=+1: to-card enters from BELOW (opposite of from-exit direction)', () => {
        // Unified-strip slide: from-card exits UP (sign=+1 vertical) and the
        // new card enters from BELOW the viewport, both moving up together.
        // The previous behaviour had to-card entering from above — which made
        // the two cards pass through each other vertically.
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
                axis: 'vertical',
                sign: 1,
                durationMs: 700,
                viewport,
            },
        )
        step(0)
        // sign=+1 vertical → to-card starts BELOW (y > viewport.height)
        expect(world.getPosition(b).y).toBeGreaterThan(viewport.height)
        step(700)
        expect(world.getPosition(b).y).toBeCloseTo(300, 1)
    })

    test('vertical sign=-1: to-card enters from ABOVE (falls down into view)', () => {
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
                axis: 'vertical',
                sign: -1,
                durationMs: 700,
                viewport,
            },
        )
        step(0)
        // sign=-1 vertical → to-card starts ABOVE (negative y)
        expect(world.getPosition(b).y).toBeLessThan(0)
        step(700)
        expect(world.getPosition(b).y).toBeCloseTo(300, 1)
    })

    test('sensorEdges: ceiling — toggles ceiling sensor on init, restores at end', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        world.registerById('a', { x: 400, y: 300 }, { width: 200, height: 100 })

        expect(world.isSensor(world.ceilingHandle)).toBe(false)

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            {
                axis: 'vertical',
                sign: 1,
                durationMs: 700,
                viewport,
                sensorEdges: 'ceiling',
            },
        )

        step(0)
        expect(world.isSensor(world.ceilingHandle)).toBe(true)

        step(700)
        expect(world.isSensor(world.ceilingHandle)).toBe(false)
    })

    test('sensorEdges: floor — toggles floor sensor (back/T4-back direction)', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        world.registerById('a', { x: 400, y: 300 }, { width: 200, height: 100 })

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            {
                axis: 'vertical',
                sign: -1,
                durationMs: 100,
                viewport,
                sensorEdges: 'floor',
            },
        )

        step(0)
        expect(world.isSensor(world.floorHandle)).toBe(true)
        expect(world.isSensor(world.ceilingHandle)).toBe(false)

        step(100)
        expect(world.isSensor(world.floorHandle)).toBe(false)
    })

    test('sensorEdges omitted — neither edge is toggled', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        world.registerById('a', { x: 400, y: 300 }, { width: 200, height: 100 })

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            {
                axis: 'vertical',
                sign: 1,
                durationMs: 100,
                viewport,
            },
        )

        step(0)
        expect(world.isSensor(world.ceilingHandle)).toBe(false)
        expect(world.isSensor(world.floorHandle)).toBe(false)
        step(100)
        expect(world.isSensor(world.ceilingHandle)).toBe(false)
        expect(world.isSensor(world.floorHandle)).toBe(false)
    })

    test('from-card tether is captured on init and NOT restored (card is dying)', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const a = world.registerById(
            'a',
            { x: 400, y: 300 },
            { width: 200, height: 100 },
        )
        world.tether.add(world.ceilingHandle, a, 250)
        expect(
            world.tether.records().filter((t) => t.child === a),
        ).toHaveLength(1)

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

        step(0)
        expect(
            world.tether.records().filter((t) => t.child === a),
        ).toHaveLength(0)

        step(700)
        // From-card stays untethered — TransitionDirector releases it next.
        expect(
            world.tether.records().filter((t) => t.child === a),
        ).toHaveLength(0)
    })
})
