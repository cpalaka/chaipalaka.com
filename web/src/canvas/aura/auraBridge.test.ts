import { describe, test, expect } from 'vitest'
import { writeAuraRects, AURA_PARK_SENTINEL } from './auraBridge'

// Records every write()/writeRot() call as [slot, x, y, z, w] / [slot, cos, sin];
// the production caller instead mutates its pre-allocated uniform vectors in
// place.
function collect(
    buf: Float32Array,
    count: number,
    maxCards: number,
    rotBuf?: Float32Array,
) {
    const rows: number[][] = []
    const rotRows: number[][] = []
    writeAuraRects(
        buf,
        rotBuf ?? new Float32Array(maxCards * 2),
        count,
        maxCards,
        (slot, x, y, z, w) => rows.push([slot, x, y, z, w]),
        (slot, cos, sin) => rotRows.push([slot, cos, sin]),
    )
    return { rows, rotRows }
}

describe('writeAuraRects', () => {
    test('packs active card rects into the leading slots verbatim', () => {
        const buf = new Float32Array([100, 200, 30, 20, 400, 500, 40, 25])
        const { rows } = collect(buf, 2, 4)
        expect(rows[0]).toEqual([0, 100, 200, 30, 20])
        expect(rows[1]).toEqual([1, 400, 500, 40, 25])
    })

    test('parks every slot at or beyond count off-screen with zero size', () => {
        const buf = new Float32Array([100, 200, 30, 20, 400, 500, 40, 25])
        const { rows } = collect(buf, 2, 4)
        expect(rows[2]).toEqual([2, AURA_PARK_SENTINEL, AURA_PARK_SENTINEL, 0, 0])
        expect(rows[3]).toEqual([3, AURA_PARK_SENTINEL, AURA_PARK_SENTINEL, 0, 0])
    })

    test('writes exactly one rect row and one rot row per GPU slot', () => {
        const buf = new Float32Array(4 * 4)
        const { rows, rotRows } = collect(buf, 1, 4)
        expect(rows).toHaveLength(4)
        expect(rotRows).toHaveLength(4)
    })

    test('count 0 parks all slots', () => {
        const { rows } = collect(new Float32Array(4 * 4), 0, 4)
        expect(rows.every((r) => r[1] === AURA_PARK_SENTINEL)).toBe(true)
    })

    test('count over maxCards is clamped (no out-of-range slot writes)', () => {
        const buf = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8])
        const { rows } = collect(buf, 99, 2)
        expect(rows).toHaveLength(2)
        expect(rows[0]).toEqual([0, 1, 2, 3, 4])
        expect(rows[1]).toEqual([1, 5, 6, 7, 8])
    })

    test('active slots carry their [cos, sin] pair; parked slots get identity', () => {
        const buf = new Float32Array([100, 200, 30, 20, 400, 500, 40, 25])
        const rotBuf = new Float32Array([0.8, 0.6, -0.6, 0.8])
        const { rotRows } = collect(buf, 2, 4, rotBuf)
        expect(rotRows[0]!).toEqual([0, expect.closeTo(0.8, 5), expect.closeTo(0.6, 5)])
        expect(rotRows[1]!).toEqual([1, expect.closeTo(-0.6, 5), expect.closeTo(0.8, 5)])
        expect(rotRows[2]).toEqual([2, 1, 0])
        expect(rotRows[3]).toEqual([3, 1, 0])
    })
})
