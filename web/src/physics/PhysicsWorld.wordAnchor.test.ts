import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from './PhysicsWorld'

const DT = 1000 / 60

// The two runtime primitives the v2 word-anchored regime (task-023 / ADR-0006)
// adds: a static word-anchor proxy body, and a velocity-preserving translate
// (the spike's translate-pair, G1).
describe('PhysicsWorld word-anchor primitives', () => {
    test('registerAnchor is a static body that does not move under gravity', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const a = world.registerAnchor({ x: 100, y: 100 })
        expect(world.isStatic(a)).toBe(true)
        world.tick(DT)
        world.tick(DT)
        const p = world.getPosition(a)
        expect(p.x).toBeCloseTo(100, 5)
        expect(p.y).toBeCloseTo(100, 5)
    })

    test('translate moves a body by a delta and PRESERVES its velocity', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const h = world.registerById('c', { x: 0, y: 0 }, { width: 10, height: 10 })
        world.setVelocity(h, { x: 5, y: -3 })
        world.translate(h, { x: 100, y: 40 })
        const p = world.getPosition(h)
        expect(p.x).toBeCloseTo(100, 5)
        expect(p.y).toBeCloseTo(40, 5)
        const v = world.getVelocity(h)
        expect(v.x).toBeCloseTo(5, 5)
        expect(v.y).toBeCloseTo(-3, 5)
    })

    test('onBeforeTick callbacks run each tick, and unsubscribe stops them', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        // Centre of the viewport, clear of the side walls (a body at x≈0 would
        // overlap the left wall and be pushed right by collision resolution).
        const h = world.registerById('c', { x: 400, y: 300 }, { width: 10, height: 10 })
        // translate-pair injects no velocity, so each +1 nudge moves x by exactly 1.
        const stop = world.onBeforeTick(() => world.translate(h, { x: 1, y: 0 }))
        world.tick(DT)
        world.tick(DT)
        expect(world.getPosition(h).x).toBeCloseTo(402, 5)
        stop()
        world.tick(DT)
        expect(world.getPosition(h).x).toBeCloseTo(402, 5) // unsubscribed: no more nudges
    })

    test('translate-pair keeps the rope vector invariant across a scroll step', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
        const anchor = world.registerAnchor({ x: 100, y: 100 })
        const card = world.registerById(
            'card',
            { x: 100, y: 300 },
            { width: 50, height: 50 },
        )
        world.tether.add(anchor, card, 200)
        const before = world.tether.list()[0]!

        // one scroll frame: anchor tracks the word's new position, card paired
        const delta = { x: 0, y: -50 }
        world.setPosition(anchor, { x: 100, y: 50 })
        world.translate(card, delta)

        const after = world.tether.list()[0]!
        expect(after.parentPos.x - after.childPos.x).toBeCloseTo(
            before.parentPos.x - before.childPos.x,
            5,
        )
        expect(after.parentPos.y - after.childPos.y).toBeCloseTo(
            before.parentPos.y - before.childPos.y,
            5,
        )
    })
})
