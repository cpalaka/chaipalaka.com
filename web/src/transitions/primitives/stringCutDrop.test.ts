import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from '../../physics/PhysicsWorld'
import { stringCutDrop } from './stringCutDrop'

const FIXED_DT_MS = 1000 / 60

function runUntil(step: (dt: number) => boolean, world: PhysicsWorld) {
    let done = false
    let frames = 0
    while (!done && frames < 600) {
        done = step(FIXED_DT_MS)
        world.tick(FIXED_DT_MS)
        frames++
    }
    return { done, frames }
}

describe('stringCutDrop (T1)', () => {
    test('cuts ceiling tether of a strung card; card falls past the viewport', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const card = world.registerById(
            'a',
            { x: 400, y: 200 },
            { width: 200, height: 100 },
        )
        world.tether.add(world.ceilingHandle, card, 150, { x: 0, y: 0 })
        expect(world.tether.records()).toHaveLength(1)

        const step = stringCutDrop(world, ['a'], { viewport })

        // First step performs setup (cuts tether)
        step(0)
        expect(world.tether.records()).toHaveLength(0)

        const { done } = runUntil(step, world)
        expect(done).toBe(true)
        const final = world.getPosition(card)
        expect(final.y).toBeGreaterThan(viewport.height)
    })

    test('preserves card-to-card chain tether (only direct ceiling tether is cut)', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const parent = world.registerById(
            'p',
            { x: 400, y: 200 },
            { width: 200, height: 100 },
        )
        const child = world.registerById(
            'c',
            { x: 400, y: 360 },
            { width: 200, height: 100 },
        )
        world.tether.add(world.ceilingHandle, parent, 150, { x: 0, y: 0 })
        world.tether.add(parent, child, 160)
        expect(world.tether.records()).toHaveLength(2)

        const step = stringCutDrop(world, ['p', 'c'], { viewport })
        step(0)
        const remaining = world.tether.records()
        expect(remaining).toHaveLength(1)
        expect(remaining[0]?.parent).toBe(parent)
        expect(remaining[0]?.child).toBe(child)
    })

    test('balloon rises symmetrically after its floor tether is cut', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const balloon = world.registerById(
            'b',
            { x: 400, y: 400 },
            { width: 200, height: 100 },
        )
        world.setBuoyancy(balloon, 'balloon')
        world.tether.add(world.floorHandle, balloon, 150, { x: 0, y: 0 })
        const startY = world.getPosition(balloon).y

        const step = stringCutDrop(world, ['b'], {
            viewport,
            hardCeilingMs: 5000,
        })
        step(0)
        expect(world.tether.records()).toHaveLength(0)

        const { done } = runUntil(step, world)
        expect(done).toBe(true)
        const final = world.getPosition(balloon)
        // Balloon moved upward (lower y) after its floor tether was cut.
        expect(final.y).toBeLessThan(startY)
    })

    test('resolves at hard-ceiling timeout even when card has not cleared', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        world.registerById(
            'stuck',
            { x: 400, y: 200 },
            { width: 200, height: 100 },
        )
        // No tether — card just falls slowly under gravity.

        const step = stringCutDrop(world, ['stuck'], {
            viewport,
            hardCeilingMs: 100,
        })
        let elapsed = 0
        let done = false
        while (!done && elapsed < 200) {
            done = step(FIXED_DT_MS)
            elapsed += FIXED_DT_MS
        }
        expect(done).toBe(true)
        expect(elapsed).toBeGreaterThanOrEqual(100)
    })

    test('puts the floor in sensor mode so exiting cards fall through it', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        // Register an uncleared card so the primitive stays mid-flight (and
        // therefore keeps the floor in sensor mode) at the time we observe.
        world.registerById(
            'in-flight',
            { x: 400, y: 200 },
            { width: 200, height: 100 },
        )
        expect(world.isSensor(world.floorHandle)).toBe(false)
        const step = stringCutDrop(world, ['in-flight'], { viewport })
        step(0)
        expect(world.isSensor(world.floorHandle)).toBe(true)
        // The floor body itself does not move — moving the body would shift
        // the effective anchor of any tether wired to the floor (anchorA is
        // body-relative) and drag incoming cards. See i111 regression.
        const floorPos = world.getPosition(world.floorHandle).y
        expect(floorPos).toBeLessThanOrEqual(viewport.height + 30)
    })

    test('only cuts tethers belonging to exiting cards (incoming card stays strung)', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const exiting = world.registerById(
            'old',
            { x: 200, y: 200 },
            { width: 200, height: 100 },
        )
        const incoming = world.registerById(
            'new',
            { x: 600, y: 200 },
            { width: 200, height: 100 },
        )
        world.tether.add(world.ceilingHandle, exiting, 150, { x: 0, y: 0 })
        world.tether.add(world.ceilingHandle, incoming, 150, { x: 0, y: 0 })

        const step = stringCutDrop(world, ['old'], { viewport })
        step(0)

        const remaining = world.tether.records()
        expect(remaining).toHaveLength(1)
        expect(remaining[0]?.child).toBe(incoming)
    })

    test('kicks exiting cards along the buoyancy axis on init', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        const heavy = world.registerById(
            'h',
            { x: 200, y: 200 },
            { width: 200, height: 100 },
        )
        const balloon = world.registerById(
            'b',
            { x: 600, y: 400 },
            { width: 200, height: 100 },
        )
        world.setBuoyancy(balloon, 'balloon')
        world.tether.add(world.ceilingHandle, heavy, 150, { x: 0, y: 0 })
        world.tether.add(world.floorHandle, balloon, 150, { x: 0, y: 0 })

        const step = stringCutDrop(world, ['h', 'b'], { viewport })
        step(0)

        // Heavy gets downward kick (gravity direction).
        const vh = world.getVelocity(heavy)
        expect(vh.y).toBeGreaterThan(0)
        // Balloon gets upward kick (opposite gravity).
        const vb = world.getVelocity(balloon)
        expect(vb.y).toBeLessThan(0)
    })

    test('clears the floor sensor flag on completion', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })

        const step = stringCutDrop(world, [], {
            viewport,
            hardCeilingMs: 50,
        })
        // Tick until the primitive returns true (hits hard ceiling with no cards).
        let elapsed = 0
        let done = false
        while (!done && elapsed < 200) {
            done = step(FIXED_DT_MS)
            elapsed += FIXED_DT_MS
        }
        expect(done).toBe(true)
        expect(world.isSensor(world.floorHandle)).toBe(false)
    })

    test('does not perturb a non-exiting card whose trail tethers the floor', () => {
        const viewport = { width: 800, height: 600 }
        const world = new PhysicsWorld({ viewport })
        // Exiting card (parent of string-cut).
        const exiting = world.registerById(
            'old',
            { x: 200, y: 200 },
            { width: 200, height: 100 },
        )
        world.tether.add(world.ceilingHandle, exiting, 150, { x: 0, y: 0 })
        // Incoming card with a trail tether to the floor (mirrors next-nav on
        // a paginated /blog section). Anchor at y=400; trail tether length is
        // the same as the gap from incoming anchor to floor anchor.
        const incoming = world.registerById(
            'incoming',
            { x: 600, y: 400 },
            { width: 200, height: 100 },
        )
        world.tether.add(world.ceilingHandle, incoming, 400, { x: 0, y: 0 })
        const floorAnchor = world.getAnchor(world.floorHandle)
        const trailLength = Math.abs(400 - floorAnchor.y)
        world.tether.add(world.floorHandle, incoming, trailLength, {
            x: 600 - floorAnchor.x,
            y: 0,
        })
        const incomingStartY = world.getPosition(incoming).y

        const step = stringCutDrop(world, ['old'], { viewport })
        // Run for several frames so any spurious overshoot from a moved-floor
        // would have had time to drag the incoming card downward.
        for (let i = 0; i < 30; i++) {
            step(FIXED_DT_MS)
            world.tick(FIXED_DT_MS)
        }

        const incomingFinalY = world.getPosition(incoming).y
        // The incoming card should not have moved further than its own
        // settling pendulum drift (~20px) — pre-fix, the moved floor created
        // a huge overshoot that yanked this card down hundreds of pixels.
        expect(Math.abs(incomingFinalY - incomingStartY)).toBeLessThan(20)
    })
})
