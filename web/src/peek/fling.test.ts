import { describe, test, expect } from 'vitest'
import { computeFlingVelocity } from './fling'

const SAMPLES = [0, 0.1, 0.25, 0.5, 0.73, 0.99]
const SPEED = 8

describe('computeFlingVelocity (isotropic random dismissal fling)', () => {
    test('magnitude equals the given speed for any rng', () => {
        for (const r of SAMPLES) {
            const v = computeFlingVelocity(() => r, SPEED)
            expect(Math.hypot(v.x, v.y)).toBeCloseTo(SPEED, 6)
        }
    })

    test('sweeps the full circle — rng maps angle across 2π', () => {
        // rng 0 → +x, 0.25 → +y (down), 0.5 → −x, 0.75 → −y (up).
        expect(computeFlingVelocity(() => 0, SPEED)).toMatchObject({
            x: expect.closeTo(SPEED, 6),
            y: expect.closeTo(0, 6),
        })
        expect(computeFlingVelocity(() => 0.25, SPEED)).toMatchObject({
            x: expect.closeTo(0, 6),
            y: expect.closeTo(SPEED, 6),
        })
        expect(computeFlingVelocity(() => 0.5, SPEED)).toMatchObject({
            x: expect.closeTo(-SPEED, 6),
            y: expect.closeTo(0, 6),
        })
        expect(computeFlingVelocity(() => 0.75, SPEED)).toMatchObject({
            x: expect.closeTo(0, 6),
            y: expect.closeTo(-SPEED, 6),
        })
    })

    test('is not upward-biased — y takes both signs across the range', () => {
        expect(computeFlingVelocity(() => 0.25, SPEED).y).toBeGreaterThan(0)
        expect(computeFlingVelocity(() => 0.75, SPEED).y).toBeLessThan(0)
    })

    test('direction varies with rng', () => {
        const a = computeFlingVelocity(() => 0.1, SPEED)
        const b = computeFlingVelocity(() => 0.6, SPEED)
        expect(a.x !== b.x || a.y !== b.y).toBe(true)
    })
})
