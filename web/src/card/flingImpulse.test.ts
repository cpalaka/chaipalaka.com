import { describe, test, expect } from 'vitest'
import { computeFlingImpulse } from './flingImpulse'

describe('computeFlingImpulse', () => {
    test('normal fling: scales raw delta by config.scale / dtMs', () => {
        // dx=10 over dt=16ms → vx = 10/16; * scale 16 = 10
        const out = computeFlingImpulse(
            { dx: 10, dy: 0, dtMs: 16 },
            5,
            { scale: 16, pauseMs: 50 },
        )
        expect(out.vx).toBeCloseTo(10, 10)
        expect(out.vy).toBeCloseTo(0, 10)
    })

    test('zero impulse when sinceLastMoveMs exceeds pauseMs (paused before release)', () => {
        const out = computeFlingImpulse(
            { dx: 100, dy: 100, dtMs: 16 },
            80,
            { scale: 16, pauseMs: 50 },
        )
        expect(out.vx).toBe(0)
        expect(out.vy).toBe(0)
    })

    test('zero dtMs is clamped to 1 — no divide-by-zero', () => {
        const out = computeFlingImpulse(
            { dx: 5, dy: 0, dtMs: 0 },
            5,
            { scale: 16, pauseMs: 50 },
        )
        // dt clamped to 1 → vx = (5/1)*16 = 80
        expect(out.vx).toBe(80)
        expect(out.vy).toBe(0)
        expect(Number.isFinite(out.vx)).toBe(true)
    })
})
