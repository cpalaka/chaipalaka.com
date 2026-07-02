import { describe, test, expect } from 'vitest'
import { brownianKick, DRIFT_REF_TICK_MS, proseRepelForce } from './drift'

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

describe('brownianKick', () => {
    test('deterministic under an injected RNG (draws x then y)', () => {
        const seq = [0.5, 1.0]
        let i = 0
        const rng = () => seq[i++]!
        const k = brownianKick(rng, DRIFT_REF_TICK_MS, 1)
        // rng()=0.5 → 0; rng()=1.0 → +1 (× scale 1 at the reference tick)
        expect(k.x).toBeCloseTo(0, 9)
        expect(k.y).toBeCloseTo(1, 9)
    })

    test('rand ∈ [-1,1]: 0.75 → +0.5 per component at the reference tick', () => {
        const k = brownianKick(() => 0.75, DRIFT_REF_TICK_MS, 1)
        expect(k.x).toBeCloseTo(0.5, 9)
        expect(k.y).toBeCloseTo(0.5, 9)
    })

    test('scales as sqrt(dt): 4× the reference tick doubles the kick', () => {
        const ref = brownianKick(() => 1, DRIFT_REF_TICK_MS, 1)
        const big = brownianKick(() => 1, 4 * DRIFT_REF_TICK_MS, 1)
        expect(big.x / ref.x).toBeCloseTo(2, 9)
    })
})
