import { describe, test, expect } from 'vitest'
import { driftImpulse, nextImpulseDelay, proseRepelForce } from './drift'

// Content box: centre (200,150), spans x∈[100,300], y∈[100,200].
const RECT = { x: 100, y: 100, width: 200, height: 100 }
const finite = (f: { x: number; y: number }) =>
    Number.isFinite(f.x) && Number.isFinite(f.y)

describe('proseRepelForce', () => {
    test('a body outside-right of the box is pushed outward (+x), finite', () => {
        const f = proseRepelForce({ x: 400, y: 150 }, RECT, 200, 1)
        expect(f.x).toBeGreaterThan(0)
        expect(Math.abs(f.y)).toBeLessThan(1e-9)
        expect(finite(f)).toBe(true)
    })

    test('outside a corner: diagonal outward, finite', () => {
        // bottom-right of the box → nearest point is the corner (300,200)
        const f = proseRepelForce({ x: 360, y: 260 }, RECT, 200, 1)
        expect(f.x).toBeGreaterThan(0)
        expect(f.y).toBeGreaterThan(0)
        expect(finite(f)).toBe(true)
    })

    test('inside the rect, off-centre: outward toward the nearest edge', () => {
        // (280,150): x-edge (right, x=300) is nearest → push +x
        const f = proseRepelForce({ x: 280, y: 150 }, RECT, 200, 1)
        expect(f.x).toBeGreaterThan(0)
        expect(Math.abs(f.y)).toBeLessThan(1e-9)
        expect(finite(f)).toBe(true)
    })

    test('inside near the top edge: pushed up (-y)', () => {
        // (200,110): top edge (y=100) nearest → push -y
        const f = proseRepelForce({ x: 200, y: 110 }, RECT, 200, 1)
        expect(f.y).toBeLessThan(0)
        expect(Math.abs(f.x)).toBeLessThan(1e-9)
        expect(finite(f)).toBe(true)
    })

    test('at the exact centre: finite and non-zero (defined outward)', () => {
        const f = proseRepelForce({ x: 200, y: 150 }, RECT, 200, 1)
        expect(finite(f)).toBe(true)
        expect(Math.hypot(f.x, f.y)).toBeGreaterThan(0)
    })

    test('inside the rect is at full strength (falloff clamps to 1)', () => {
        const f = proseRepelForce({ x: 280, y: 150 }, RECT, 200, 3)
        expect(Math.hypot(f.x, f.y)).toBeCloseTo(3, 6)
    })

    test('on the edge: full strength, outward', () => {
        const f = proseRepelForce({ x: 300, y: 150 }, RECT, 200, 1)
        expect(f.x).toBeGreaterThan(0)
        expect(Math.hypot(f.x, f.y)).toBeCloseTo(1, 6)
    })

    test('beyond the radius: zero force', () => {
        const f = proseRepelForce({ x: 200, y: 1000 }, RECT, 200, 1)
        expect(Math.hypot(f.x, f.y)).toBeCloseTo(0, 9)
    })

    test('falls off linearly with signed distance outside', () => {
        // (400,150): 100px outside, radius 200 → half strength
        const f = proseRepelForce({ x: 400, y: 150 }, RECT, 200, 1)
        expect(f.x).toBeCloseTo(0.5, 6)
    })
})

describe('driftImpulse', () => {
    test('rng 0 ⇒ angle 0 ⇒ points along +x at the given speed', () => {
        const k = driftImpulse(() => 0, 3)
        expect(k.x).toBeCloseTo(3, 9)
        expect(k.y).toBeCloseTo(0, 9)
    })

    test('rng 0.25 ⇒ angle π/2 ⇒ points along +y', () => {
        const k = driftImpulse(() => 0.25, 2)
        expect(k.x).toBeCloseTo(0, 9)
        expect(k.y).toBeCloseTo(2, 9)
    })

    test('magnitude equals speed for any direction (unit vector × speed)', () => {
        const k = driftImpulse(() => 0.37, 5)
        expect(Math.hypot(k.x, k.y)).toBeCloseTo(5, 9)
    })

    test('draws exactly one rng value — the direction angle (no dt term)', () => {
        // A second draw would come from 0.25 (angle π/2); assert only the first
        // (angle 0 → +x) is consumed, so an impulse is a single discrete event.
        const seq = [0, 0.25]
        let i = 0
        const k = driftImpulse(() => seq[i++]!, 4)
        expect(k.x).toBeCloseTo(4, 9)
        expect(k.y).toBeCloseTo(0, 9)
        expect(i).toBe(1)
    })
})

describe('nextImpulseDelay', () => {
    test('rng 0 ⇒ half the mean interval (jitter floor)', () => {
        expect(nextImpulseDelay(() => 0, 4000)).toBeCloseTo(2000, 9)
    })

    test('rng → 1 ⇒ 1.5× the mean interval (jitter ceiling)', () => {
        expect(nextImpulseDelay(() => 1, 4000)).toBeCloseTo(6000, 9)
    })

    test('rng 0.5 ⇒ exactly the mean interval', () => {
        expect(nextImpulseDelay(() => 0.5, 4000)).toBeCloseTo(4000, 9)
    })
})
