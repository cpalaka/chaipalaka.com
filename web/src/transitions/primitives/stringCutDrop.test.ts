import { describe, test, expect } from 'vitest'
import { createFakeBodyDriver } from '../../physics/createFakeBodyDriver'
import { physicsTuning } from '../../physics/physicsTuning'
import { stringCutDrop } from './stringCutDrop'

const FIXED_DT_MS = 1000 / 60
const EXIT_KICK = physicsTuning.exitKick

function newFake() {
    const fake = createFakeBodyDriver({ gravity: { x: 0, y: 0.7 } })
    const ceiling = fake.registerBody('__ceiling', {
        position: { x: 400, y: 0 },
        isStatic: true,
    })
    const floor = fake.registerBody('__floor', {
        position: { x: 400, y: 600 },
        isStatic: true,
    })
    return { fake, ceiling, floor }
}

describe('stringCutDrop (T1)', () => {
    test('cuts the ceiling tether of a strung card on init', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling, floor } = newFake()
        const card = fake.registerBody('a', {
            position: { x: 400, y: 200 },
            size: { width: 200, height: 100 },
        })
        fake.addTether({
            parent: ceiling,
            child: card,
            length: 150,
            anchorA: { x: 0, y: 0 },
        })
        expect(fake.getTethers()).toHaveLength(1)

        const step = stringCutDrop(fake.driver, ['a'], { viewport, floorHandle: floor })
        step(0)
        // Static-parent tether is severed; not reattached.
        expect(fake.getTethers().filter((t) => t.child === card)).toHaveLength(0)
    })

    test('discards chain tether when both parent and child are exiting (full route exit)', () => {
        // Production scenario: a chained route like /blog exits as a whole. Every
        // card in the chain is in `cardIds`, so reattaching child→parent tethers
        // would leave them pointing at handles that unregister moments later
        // when the route unmounts, producing `unknown handle N` throws on the
        // next physics tick.
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling, floor } = newFake()
        const parent = fake.registerBody('p', {
            position: { x: 400, y: 200 },
            size: { width: 200, height: 100 },
        })
        const child = fake.registerBody('c', {
            position: { x: 400, y: 360 },
            size: { width: 200, height: 100 },
        })
        fake.addTether({
            parent: ceiling,
            child: parent,
            length: 150,
            anchorA: { x: 0, y: 0 },
        })
        fake.addTether({ parent: parent, child: child, length: 160 })
        expect(fake.getTethers()).toHaveLength(2)

        const step = stringCutDrop(fake.driver, ['p', 'c'], { viewport, floorHandle: floor })
        step(0)

        // Both tethers must be severed: the ceiling→parent one because the
        // parent is static, and the parent→child one because the parent is
        // also exiting.
        expect(fake.getTethers()).toHaveLength(0)
    })

    test('preserves chain tether when parent stays and only child exits', () => {
        // Reattach path: child is in `cardIds` but its parent is not. The
        // dynamic-parent tether is detached and immediately reattached so the
        // child keeps swinging from a body that survives the transition.
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling, floor } = newFake()
        const parent = fake.registerBody('p', {
            position: { x: 400, y: 200 },
            size: { width: 200, height: 100 },
        })
        const child = fake.registerBody('c', {
            position: { x: 400, y: 360 },
            size: { width: 200, height: 100 },
        })
        fake.addTether({
            parent: ceiling,
            child: parent,
            length: 150,
            anchorA: { x: 0, y: 0 },
        })
        fake.addTether({ parent: parent, child: child, length: 160 })

        const step = stringCutDrop(fake.driver, ['c'], { viewport, floorHandle: floor })
        step(0)

        const remaining = fake.getTethers()
        expect(remaining).toHaveLength(2)
        const reattached = remaining.find((t) => t.child === child)
        expect(reattached?.parent).toBe(parent)
    })

    test('kick magnitude + direction: heavy uses gravity sign, balloon uses opposite', () => {
        // Motion-shape assertion impossible against the old world fixture:
        // the kick magnitude is EXIT_KICK along the normalized gravity vector,
        // with sign per getBuoyancy. Reads the exact setVelocity values.
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling, floor } = newFake()
        const heavy = fake.registerBody('h', {
            position: { x: 200, y: 200 },
            size: { width: 200, height: 100 },
            buoyancy: 'heavy',
        })
        const balloon = fake.registerBody('b', {
            position: { x: 600, y: 400 },
            size: { width: 200, height: 100 },
            buoyancy: 'balloon',
        })
        fake.addTether({ parent: ceiling, child: heavy, length: 150 })
        fake.addTether({ parent: floor, child: balloon, length: 150 })

        const step = stringCutDrop(fake.driver, ['h', 'b'], { viewport, floorHandle: floor })
        step(0)

        // Heavy: gravity is (0, 0.7), normalized to (0, 1). Sign +1.
        // Initial velocity was zero; final velocity y should be +EXIT_KICK.
        const vh = fake.getState(heavy)!.velocity
        expect(vh.x).toBeCloseTo(0, 5)
        expect(vh.y).toBeCloseTo(EXIT_KICK, 5)

        // Balloon: same gravity normal, sign -1.
        const vb = fake.getState(balloon)!.velocity
        expect(vb.x).toBeCloseTo(0, 5)
        expect(vb.y).toBeCloseTo(-EXIT_KICK, 5)
    })

    test('kick is additive on top of pre-existing velocity', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling, floor } = newFake()
        const card = fake.registerBody('a', {
            position: { x: 400, y: 200 },
            size: { width: 200, height: 100 },
            velocity: { x: 3, y: -2 },
        })
        fake.addTether({ parent: ceiling, child: card, length: 150 })

        const step = stringCutDrop(fake.driver, ['a'], { viewport, floorHandle: floor })
        step(0)
        const v = fake.getState(card)!.velocity
        // Gravity (0, 0.7) normalizes to (0, 1) → kick contributes (0, +10).
        expect(v.x).toBeCloseTo(3, 5)
        expect(v.y).toBeCloseTo(-2 + EXIT_KICK, 5)
    })

    test('resolves at hard-ceiling timeout even when card has not cleared', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, floor } = newFake()
        fake.registerBody('stuck', {
            position: { x: 400, y: 200 },
            size: { width: 200, height: 100 },
        })

        const step = stringCutDrop(fake.driver, ['stuck'], {
            viewport,
            floorHandle: floor,
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

    test('puts the floor in sensor mode on init and restores on finalize', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, floor } = newFake()
        fake.registerBody('in-flight', {
            position: { x: 400, y: 200 },
            size: { width: 200, height: 100 },
        })
        expect(fake.getState(floor)!.isSensor).toBe(false)
        const step = stringCutDrop(fake.driver, ['in-flight'], {
            viewport,
            floorHandle: floor,
            hardCeilingMs: 50,
        })
        step(0)
        expect(fake.getState(floor)!.isSensor).toBe(true)

        // Drive past hardCeilingMs to trigger finalize.
        let elapsed = 0
        let done = false
        while (!done && elapsed < 200) {
            done = step(FIXED_DT_MS)
            elapsed += FIXED_DT_MS
        }
        expect(done).toBe(true)
        expect(fake.getState(floor)!.isSensor).toBe(false)
    })

    test('only cuts tethers belonging to exiting cards (incoming card stays strung)', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling, floor } = newFake()
        const exiting = fake.registerBody('old', {
            position: { x: 200, y: 200 },
            size: { width: 200, height: 100 },
        })
        const incoming = fake.registerBody('new', {
            position: { x: 600, y: 200 },
            size: { width: 200, height: 100 },
        })
        fake.addTether({ parent: ceiling, child: exiting, length: 150 })
        fake.addTether({ parent: ceiling, child: incoming, length: 150 })

        const step = stringCutDrop(fake.driver, ['old'], { viewport, floorHandle: floor })
        step(0)

        const remaining = fake.getTethers()
        expect(remaining).toHaveLength(1)
        expect(remaining[0]?.child).toBe(incoming)
    })

    test('allCleared honours getSize: heavy card released when top crosses below viewport', () => {
        // Motion-shape assertion: predicate uses (pos.y - height/2) > vp.h+pad.
        // We simulate physics by manually setting the position past the
        // threshold and asserting the primitive returns true.
        const viewport = { width: 800, height: 600 }
        const { fake, floor } = newFake()
        const card = fake.registerBody('a', {
            position: { x: 400, y: 200 },
            size: { width: 200, height: 100 },
            buoyancy: 'heavy',
        })

        const step = stringCutDrop(fake.driver, ['a'], { viewport, floorHandle: floor })
        step(0)
        // Move card just *short* of the clear threshold: top = viewport.h + 100,
        // i.e. y = viewport.h + 100 + height/2 = 750. With pad=100, threshold
        // is top > 700.
        fake.driver.setPosition(card, { x: 400, y: 749 })
        // top = 749 - 50 = 699 → NOT cleared (needs > 700).
        expect(step(FIXED_DT_MS)).toBe(false)

        // Now push the card just past the threshold.
        fake.driver.setPosition(card, { x: 400, y: 752 })
        // top = 752 - 50 = 702 → cleared.
        expect(step(FIXED_DT_MS)).toBe(true)
    })

    test('allCleared honours getSize: balloon released when bottom crosses above 0', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, floor } = newFake()
        const card = fake.registerBody('b', {
            position: { x: 400, y: 200 },
            size: { width: 200, height: 100 },
            buoyancy: 'balloon',
        })

        const step = stringCutDrop(fake.driver, ['b'], { viewport, floorHandle: floor })
        step(0)
        // Threshold: bottom < -100 (pad). bottom = y + height/2.
        fake.driver.setPosition(card, { x: 400, y: -49 })
        // bottom = -49 + 50 = 1 → NOT cleared.
        expect(step(FIXED_DT_MS)).toBe(false)

        fake.driver.setPosition(card, { x: 400, y: -152 })
        // bottom = -152 + 50 = -102 → cleared.
        expect(step(FIXED_DT_MS)).toBe(true)
    })
})
