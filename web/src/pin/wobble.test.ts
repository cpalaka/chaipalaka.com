import { describe, it, expect } from 'vitest'
import { stepWobble, REST, type WobbleState } from './wobble'

const CFG = { stiffness: 200, damping: 12 }
const mag = (s: WobbleState) => Math.hypot(s.x, s.y)

describe('stepWobble (transform-only damped oscillator)', () => {
    it('stays at rest with no drive', () => {
        const s = stepWobble(REST, { x: 0, y: 0 }, 16, CFG)
        expect(s).toEqual(REST)
    })

    it('a displaced word with no drive decays back toward rest', () => {
        let s: WobbleState = { x: 8, y: 0, vx: 0, vy: 0 }
        for (let i = 0; i < 200; i++) s = stepWobble(s, { x: 0, y: 0 }, 16, CFG)
        expect(mag(s)).toBeLessThan(0.1)
    })

    it('a drive pulls the offset in the drive direction', () => {
        const s = stepWobble(REST, { x: 300, y: 0 }, 16, CFG)
        expect(s.x).toBeGreaterThan(0)
        expect(s.y).toBe(0)
    })

    it('settles to a bounded steady offset under a constant drive (≈ drive/stiffness)', () => {
        let s: WobbleState = REST
        for (let i = 0; i < 500; i++) s = stepWobble(s, { x: 400, y: 0 }, 16, CFG)
        expect(s.x).toBeCloseTo(400 / CFG.stiffness, 1) // ≈ 2px
        expect(Math.abs(s.vx)).toBeLessThan(0.01) // at rest
    })

    it('stays finite and bounded at the dt clamp (50ms) under a constant drive', () => {
        let s: WobbleState = REST
        for (let i = 0; i < 500; i++) s = stepWobble(s, { x: 400, y: 0 }, 50, CFG)
        expect(Number.isFinite(s.x)).toBe(true)
        expect(mag(s)).toBeLessThan(50)
    })
})
