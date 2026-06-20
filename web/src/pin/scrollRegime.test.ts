import { describe, it, expect } from 'vitest'
import { stepRegime } from './scrollRegime'

const fold = { top: 100, bottom: 500 }

describe('stepRegime (word ⇄ edge anchor regimes)', () => {
    it('stays word-anchored while the word is inside the fold', () => {
        expect(stepRegime('word', 300, fold, 20)).toEqual({
            regime: 'word',
            justParked: false,
            recallable: false,
        })
    })

    it('auto-parks at the top edge when the word scrolls up past the fold', () => {
        // word centre 50 < fold.top (100) − margin (20) = 80 → exited through the top
        expect(stepRegime('word', 50, fold, 20)).toEqual({
            regime: 'parked-top',
            justParked: true,
            recallable: false,
        })
    })

    it('auto-parks at the bottom edge when the word scrolls down past the fold', () => {
        // word centre 600 > fold.bottom (500) + margin (20) = 520 → exited through the bottom
        expect(stepRegime('word', 600, fold, 20)).toEqual({
            regime: 'parked-bottom',
            justParked: true,
            recallable: false,
        })
    })

    it('stays parked when the word re-enters the fold — recall is manual, no yo-yo (G3)', () => {
        expect(stepRegime('parked-top', 300, fold, 20)).toEqual({
            regime: 'parked-top',
            justParked: false,
            recallable: true,
        })
        expect(stepRegime('parked-bottom', 300, fold, 20)).toEqual({
            regime: 'parked-bottom',
            justParked: false,
            recallable: true,
        })
    })

    it('is not recallable while parked and the word is still out of the fold', () => {
        expect(stepRegime('parked-top', 50, fold, 20)).toEqual({
            regime: 'parked-top',
            justParked: false,
            recallable: false,
        })
    })

    it('does not park while the word is within the hysteresis margin of an edge', () => {
        // 85 is above fold.top (100) but inside the margin band (100 − 20 = 80)
        expect(stepRegime('word', 85, fold, 20).regime).toBe('word')
        // 515 is below fold.bottom (500) but inside the margin band (500 + 20 = 520)
        expect(stepRegime('word', 515, fold, 20).regime).toBe('word')
    })
})
