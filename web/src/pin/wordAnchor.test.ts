import { describe, it, expect } from 'vitest'
import { trackWord } from './wordAnchor'

const rect = (left: number, top: number, width = 40, height = 20) => ({
    left,
    top,
    width,
    height,
})

describe('trackWord (translate-pair G1 + finite-check G4)', () => {
    it('first frame anchors at the word centre with zero delta', () => {
        const r = trackWord(null, rect(100, 200, 40, 20))
        expect(r).toEqual({ anchor: { x: 120, y: 210 }, delta: { x: 0, y: 0 } })
    })

    it('tracks the word exactly across a scroll (anchor follows, delta = movement)', () => {
        const prev = { x: 120, y: 210 }
        // page scrolled down 100px → the word rect moves up 100px in viewport space
        const r = trackWord(prev, rect(100, 100, 40, 20))
        expect(r).toEqual({ anchor: { x: 120, y: 110 }, delta: { x: 0, y: -100 } })
    })

    it('does NOT clamp the per-frame delta (G1: a fling reads as its full movement)', () => {
        // word centre when at top=0 (default size 40×20) → a 5000px jump.
        const prev = { x: 20, y: 10 }
        const r = trackWord(prev, rect(0, 5000))
        expect(r?.delta).toEqual({ x: 0, y: 5000 })
    })

    it('returns null on a non-finite rect (G4: ±Infinity → skip the frame)', () => {
        expect(trackWord({ x: 0, y: 0 }, rect(Infinity, 0))).toBeNull()
        expect(trackWord({ x: 0, y: 0 }, rect(0, -Infinity))).toBeNull()
    })

    it('returns null on a NaN rect (G4)', () => {
        expect(trackWord({ x: 0, y: 0 }, rect(NaN, 0))).toBeNull()
    })

    it('returns null on a zero-size rect (detached / display:none word — task-028)', () => {
        // A word removed on nav collapses to all-zeros; a zero-size rect at any
        // position is unmeasurable, so the frame is skipped (no fling, no offset poison).
        expect(trackWord({ x: 120, y: 210 }, rect(0, 0, 0, 0))).toBeNull()
        expect(trackWord({ x: 120, y: 210 }, rect(50, 5000, 0, 0))).toBeNull()
    })
})
