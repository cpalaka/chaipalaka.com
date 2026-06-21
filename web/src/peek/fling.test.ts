import { describe, test, expect } from 'vitest'
import { computeFlingVelocity } from './fling'

const SAMPLES = [0, 0.1, 0.25, 0.5, 0.73, 0.99]
const SPEED = 18

describe('computeFlingVelocity (upward 90° cone)', () => {
    test('magnitude equals the given speed for any rng', () => {
        for (const r of SAMPLES) {
            const v = computeFlingVelocity(() => r, SPEED)
            expect(Math.hypot(v.x, v.y)).toBeCloseTo(SPEED, 6)
        }
    })

    test('always points upward — negative y, toward the ceiling', () => {
        for (const r of SAMPLES) {
            expect(computeFlingVelocity(() => r, SPEED).y).toBeLessThan(0)
        }
    })

    test('horizontal spread stays within the ±45° cone', () => {
        const max = SPEED * Math.sin(Math.PI / 4)
        for (const r of SAMPLES) {
            expect(Math.abs(computeFlingVelocity(() => r, SPEED).x)).toBeLessThanOrEqual(max + 1e-9)
        }
    })

    test('rng midpoint flings straight up', () => {
        const v = computeFlingVelocity(() => 0.5, SPEED)
        expect(v.x).toBeCloseTo(0, 6)
        expect(v.y).toBeCloseTo(-SPEED, 6)
    })

    test('direction varies with rng', () => {
        const a = computeFlingVelocity(() => 0.1, SPEED)
        const b = computeFlingVelocity(() => 0.6, SPEED)
        expect(a.x !== b.x || a.y !== b.y).toBe(true)
    })
})
