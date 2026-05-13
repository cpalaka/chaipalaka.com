import { describe, test, expect } from 'vitest'
import { PhysicsWorld, type PhysicsHandle } from '../../physics/PhysicsWorld'
import { anchorSlide } from './anchorSlide'

const FIXED_DT_MS = 1000 / 60
const DURATION_MS = 700

/**
 * Drive the slide step to completion using fixed-dt physics ticks between
 * frames. Real TransitionDirector uses requestAnimationFrame, but for the
 * test we step both the primitive and the world at a constant cadence so
 * the physics body has a chance to respond to tether-origin tweens.
 */
function runToCompletion(
    world: PhysicsWorld,
    step: ReturnType<typeof anchorSlide>,
    durationMs = DURATION_MS,
) {
    const frames = Math.ceil((durationMs * 1.05) / FIXED_DT_MS)
    let done = false
    for (let i = 0; i < frames; i++) {
        done = step(FIXED_DT_MS)
        world.tick(FIXED_DT_MS)
        if (done) break
    }
    return done
}

function stringCard(
    world: PhysicsWorld,
    id: string,
    layoutAnchor: { x: number; y: number },
    tetherLen = 150,
): PhysicsHandle {
    const ceilingPos = world.getPosition(world.ceilingHandle)
    const handle = world.registerById(id, layoutAnchor, {
        width: 200,
        height: 100,
    })
    world.tether(world.ceilingHandle, handle, tetherLen, {
        x: layoutAnchor.x - ceilingPos.x,
        y: layoutAnchor.y - tetherLen - ceilingPos.y,
    })
    return handle
}

describe('anchorSlide (T3) — horizontal, tether-driven', () => {
    test('from-card with stiff tether translates toward off-viewport on -sign side', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const handle = stringCard(world, 'a', { x: 400, y: 200 })
        const start = world.getPosition(handle)

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: DURATION_MS, viewport },
        )

        const done = runToCompletion(world, step)
        expect(done).toBe(true)
        const final = world.getPosition(handle)
        // sign=+1, from-card exits in -sign direction (leftward) — should clear viewport
        expect(final.x).toBeLessThan(0)
        expect(final.x).toBeLessThan(start.x)
    })

    test('sign=-1 flips direction (from-card exits to the right)', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const handle = stringCard(world, 'a', { x: 400, y: 200 })

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: -1, durationMs: DURATION_MS, viewport },
        )

        runToCompletion(world, step)
        const final = world.getPosition(handle)
        expect(final.x).toBeGreaterThan(viewport.width)
    })

    test('to-card enters from origin side and arrives near layout', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const handle = stringCard(world, 'b', { x: 400, y: 200 })

        const step = anchorSlide(
            world,
            { fromIds: [], toIds: ['b'] },
            { axis: 'horizontal', sign: 1, durationMs: DURATION_MS, viewport },
        )

        // After init, the tether origin should be off-screen on the origin
        // side (left), so the card gets yanked leftward immediately.
        step(0)
        world.tick(FIXED_DT_MS)
        expect(world.getPosition(handle).x).toBeLessThan(400)

        runToCompletion(world, step)
        // After the slide ends, the body keeps pendulum-settling toward
        // the rope origin under continued physics. Real app behaviour —
        // TransitionDirector returns, but the physics loop ticks on.
        for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
        const final = world.getPosition(handle)
        // Pendulum landing — within a tether length of the layout anchor x
        expect(Math.abs(final.x - 400)).toBeLessThan(150)
    })

    test('detached (untethered) cards are skipped without throwing', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const handle = world.registerById(
            'a',
            { x: 400, y: 300 },
            { width: 200, height: 100 },
        )
        const start = world.getPosition(handle)

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: DURATION_MS, viewport },
        )

        expect(() => runToCompletion(world, step)).not.toThrow()
        // Untethered card is left to gravity; horizontal position roughly unchanged
        const final = world.getPosition(handle)
        expect(Math.abs(final.x - start.x)).toBeLessThan(50)
    })

    test('handles empty from/to lists without error', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })

        const step = anchorSlide(
            world,
            { fromIds: [], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: 100, viewport },
        )

        step(0)
        const done = step(100)
        expect(done).toBe(true)
    })

    test('pendulum signature: from-card swings on the y-axis as it slides', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const handle = stringCard(world, 'a', { x: 400, y: 250 }, 150)
        // Let the rope settle to its hanging equilibrium before the slide.
        for (let i = 0; i < 60; i++) world.tick(FIXED_DT_MS)
        const y0 = world.getPosition(handle).y

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: DURATION_MS, viewport },
        )

        let maxYDelta = 0
        const frames = Math.ceil((DURATION_MS * 1.05) / FIXED_DT_MS)
        for (let i = 0; i < frames; i++) {
            const done = step(FIXED_DT_MS)
            world.tick(FIXED_DT_MS)
            const y = world.getPosition(handle).y
            maxYDelta = Math.max(maxYDelta, Math.abs(y - y0))
            if (done) break
        }
        // A dynamic body lagging behind a fast-moving rope origin does not
        // travel in a perfectly straight horizontal line; it pendulums.
        // Threshold is conservative; observed deltas in practice are larger.
        expect(maxYDelta).toBeGreaterThan(2)
    })

    test('destination-side wall is sensor during the slide and restored after', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        stringCard(world, 'a', { x: 400, y: 200 })

        expect(world.isWallSensor('left')).toBe(false)
        expect(world.isWallSensor('right')).toBe(false)

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: DURATION_MS, viewport },
        )

        step(0)
        // sign=+1 → from-card exits leftward → left wall becomes sensor
        expect(world.isWallSensor('left')).toBe(true)
        expect(world.isWallSensor('right')).toBe(false)

        runToCompletion(world, step)
        expect(world.isWallSensor('left')).toBe(false)
        expect(world.isWallSensor('right')).toBe(false)
    })

    test('sign=-1 makes the right wall the sensor', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        stringCard(world, 'a', { x: 400, y: 200 })

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: -1, durationMs: DURATION_MS, viewport },
        )

        step(0)
        expect(world.isWallSensor('right')).toBe(true)
        expect(world.isWallSensor('left')).toBe(false)

        runToCompletion(world, step)
        expect(world.isWallSensor('right')).toBe(false)
    })

    test("to-card's tether stays continuously attached and ends at original anchor", () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const handle = stringCard(world, 'b', { x: 400, y: 200 }, 150)
        const ceilingPos = world.getPosition(world.ceilingHandle)
        const originalAnchor = { x: 400 - ceilingPos.x, y: 50 - ceilingPos.y }

        // Sanity: anchorA recorded matches what we wired
        const recBefore = world
            .listTetherRecords()
            .find((r) => r.child === handle)!
        expect(recBefore.anchorA?.x).toBeCloseTo(originalAnchor.x, 5)
        expect(recBefore.anchorA?.y).toBeCloseTo(originalAnchor.y, 5)

        const step = anchorSlide(
            world,
            { fromIds: [], toIds: ['b'] },
            { axis: 'horizontal', sign: 1, durationMs: DURATION_MS, viewport },
        )

        // Walk through the slide and confirm the tether is never removed.
        const frames = Math.ceil((DURATION_MS * 1.05) / FIXED_DT_MS)
        for (let i = 0; i < frames; i++) {
            const done = step(FIXED_DT_MS)
            world.tick(FIXED_DT_MS)
            expect(
                world
                    .listTetherRecords()
                    .filter((r) => r.child === handle).length,
            ).toBe(1)
            if (done) break
        }

        // At completion, anchorA is restored exactly.
        const recAfter = world
            .listTetherRecords()
            .find((r) => r.child === handle)!
        expect(recAfter.anchorA?.x).toBeCloseTo(originalAnchor.x, 5)
        expect(recAfter.anchorA?.y).toBeCloseTo(originalAnchor.y, 5)
    })

    test('from-card tether is left intact for TransitionDirector to release', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const handle = stringCard(world, 'a', { x: 400, y: 200 })
        expect(
            world.listTetherRecords().filter((r) => r.child === handle),
        ).toHaveLength(1)

        const step = anchorSlide(
            world,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: DURATION_MS, viewport },
        )

        runToCompletion(world, step)
        // Tether is NOT cut by anchorSlide; TransitionDirector calls
        // registry.release next, which unregisters the body (tether goes with it).
        expect(
            world.listTetherRecords().filter((r) => r.child === handle),
        ).toHaveLength(1)
    })
})
