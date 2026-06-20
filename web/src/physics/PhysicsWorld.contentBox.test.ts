import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from './PhysicsWorld'
import { wireTetherFor } from './Tether'

const DT = 1000 / 60

// L=200 T=100 R=600 B=300, centre x=400. Lives in an 800x600 viewport so the
// box is a sub-rectangle with clear margins (the viewport walls are at the edges).
const BOX = { x: 200, y: 100, width: 400, height: 200 }

function makeWorld() {
    return new PhysicsWorld({ viewport: { width: 800, height: 600 } })
}

describe('PhysicsWorld.setContentBox — registration', () => {
    test('exposes no box edge handles until a box is set', () => {
        const world = makeWorld()
        expect(world.contentBoxTopHandle).toBeUndefined()
        expect(world.contentBoxBottomHandle).toBeUndefined()
    })

    test('exposes tetherable top and bottom edge handles after setContentBox', () => {
        const world = makeWorld()
        world.setContentBox(BOX)
        expect(typeof world.contentBoxTopHandle).toBe('number')
        expect(typeof world.contentBoxBottomHandle).toBe('number')
    })

    test('the top/bottom edge anchors are the box top/bottom surface lines', () => {
        const world = makeWorld()
        world.setContentBox(BOX)
        expect(world.getAnchor(world.contentBoxTopHandle!)).toEqual({
            x: 400,
            y: 100,
        })
        expect(world.getAnchor(world.contentBoxBottomHandle!)).toEqual({
            x: 400,
            y: 300,
        })
    })
})

describe('PhysicsWorld.setContentBox — collision', () => {
    test('the box top edge catches a body falling from above (does not pass through)', () => {
        const world = makeWorld()
        world.setContentBox(BOX)
        const card = world.registerById(
            'faller',
            { x: 400, y: 40 },
            { width: 80, height: 40 },
        )
        for (let i = 0; i < 600; i++) world.tick(DT)
        const pos = world.getPosition(card)
        // Rests on the top surface (y=100), half-height 20 → ~80; never tunnels
        // through to the viewport floor (~580).
        expect(pos.y).toBeLessThan(100)
        expect(pos.y).toBeGreaterThan(40)
    })
})

describe('PhysicsWorld.setContentBox — edge tether (reuses wireTetherFor)', () => {
    test('a card tethers to the box bottom edge and is held above the viewport floor', () => {
        // Tall viewport so the floor (1200) is far below the box: a held card
        // stays high, a free-falling one reaches ~1180 — the soft rope's sag
        // magnitude is then irrelevant to the "held" assertion.
        const world = new PhysicsWorld({ viewport: { width: 800, height: 1200 } })
        world.setContentBox(BOX) // bottom surface y=300
        const card = world.registerById(
            'hung',
            { x: 400, y: 450 },
            { width: 80, height: 40 },
        )
        // The existing ceiling/floor edge branch, reused verbatim for a box edge.
        wireTetherFor(world, world.contentBoxBottomHandle!, 'floor', card, {
            x: 400,
            y: 450,
        })
        for (let i = 0; i < 600; i++) world.tick(DT)
        const pos = world.getPosition(card)
        // Hangs below the bottom edge surface (300), held by the rope far above
        // the distant viewport floor (1200).
        expect(pos.y).toBeGreaterThan(300)
        expect(pos.y).toBeLessThan(900)
    })
})

describe('PhysicsWorld.setContentBox — resize (G6 translate-pair / i111)', () => {
    test('moving the box on resize moves an edge-anchored card with its edge (no yank)', () => {
        const world = new PhysicsWorld({ viewport: { width: 800, height: 1200 } })
        const before = { x: 200, y: 400, width: 400, height: 200 } // bottom surface 600
        world.setContentBox(before)
        const card = world.registerById(
            'parked',
            { x: 400, y: 750 },
            { width: 80, height: 40 },
        )
        // Sensor isolates the rope from edge collisions (the spike's method) so
        // the test measures the tether response, not contact jamming.
        world.setSensor(card, true)
        wireTetherFor(world, world.contentBoxBottomHandle!, 'floor', card, {
            x: 400,
            y: 750,
        })
        for (let i = 0; i < 300; i++) world.tick(DT)

        const yBefore = world.getPosition(card).y
        // A resize moves the box (and its bottom edge body) up 300px in one
        // frame — the i111 trigger. The bottom edge centre goes 570 → 270.
        world.setContentBox({ x: 200, y: 100, width: 400, height: 200 })
        for (let i = 0; i < 5; i++) world.tick(DT)
        const yAfter = world.getPosition(card).y

        // Translate-paired: the card tracks its edge (~ -300), so its position
        // relative to the edge is unchanged. Without pairing the card lags the
        // edge and the body-relative anchor spikes the rope force.
        expect(yAfter - yBefore).toBeGreaterThan(-360)
        expect(yAfter - yBefore).toBeLessThan(-240)
    })
})

describe('PhysicsWorld.setContentBox(null) — teardown', () => {
    test('clearing removes the edges; handles go away and a body falls through', () => {
        const world = makeWorld()
        world.setContentBox(BOX)
        const top = world.contentBoxTopHandle!
        world.setContentBox(null)
        expect(world.contentBoxTopHandle).toBeUndefined()
        expect(world.has(top)).toBe(false)
        const card = world.registerById(
            'faller',
            { x: 400, y: 40 },
            { width: 80, height: 40 },
        )
        for (let i = 0; i < 600; i++) world.tick(DT)
        // No box edge to catch it → falls past where the box was.
        expect(world.getPosition(card).y).toBeGreaterThan(300)
    })
})
