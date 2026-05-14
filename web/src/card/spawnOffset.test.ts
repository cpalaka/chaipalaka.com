import { describe, test, expect } from 'vitest'
import { computeSpawnOffset } from './spawnOffset'

describe('computeSpawnOffset', () => {
    test('down gravity shifts anchor along +y by offsetPx', () => {
        const out = computeSpawnOffset({ x: 100, y: 50 }, { x: 0, y: 1 }, 20)
        expect(out.x).toBeCloseTo(100, 10)
        expect(out.y).toBeCloseTo(70, 10)
    })

    test('sideways gravity shifts anchor along +x by offsetPx', () => {
        const out = computeSpawnOffset({ x: 100, y: 50 }, { x: 1, y: 0 }, 20)
        expect(out.x).toBeCloseTo(120, 10)
        expect(out.y).toBeCloseTo(50, 10)
    })

    test('non-unit gravity is normalised before applying offset', () => {
        const out = computeSpawnOffset({ x: 0, y: 0 }, { x: 3, y: 4 }, 20)
        expect(out.x).toBeCloseTo(12, 10)
        expect(out.y).toBeCloseTo(16, 10)
    })

    test('zero-length gravity falls back to (0, 1) direction', () => {
        const out = computeSpawnOffset({ x: 10, y: 10 }, { x: 0, y: 0 }, 20)
        expect(out.x).toBeCloseTo(10, 10)
        expect(out.y).toBeCloseTo(30, 10)
    })
})
