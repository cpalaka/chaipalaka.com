import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DwellTracker } from './dwell'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('DwellTracker', () => {
    it('fires after dwellMs of stillness', () => {
        const onFire = vi.fn()
        const d = new DwellTracker({ dwellMs: 250, stillPx: 4, onFire })
        d.start(100, 100)
        vi.advanceTimersByTime(249)
        expect(onFire).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(onFire).toHaveBeenCalledTimes(1)
    })

    it('does not fire while the cursor keeps sweeping past the still threshold', () => {
        const onFire = vi.fn()
        const d = new DwellTracker({ dwellMs: 250, stillPx: 4, onFire })
        d.start(100, 100)
        vi.advanceTimersByTime(150)
        d.move(120, 100) // 20px > 4 → resets the dwell
        vi.advanceTimersByTime(150)
        d.move(140, 100) // resets again
        vi.advanceTimersByTime(200) // < 250 since the last reset
        expect(onFire).not.toHaveBeenCalled()
    })

    it('tolerates sub-threshold jitter and still fires', () => {
        const onFire = vi.fn()
        const d = new DwellTracker({ dwellMs: 250, stillPx: 4, onFire })
        d.start(100, 100)
        vi.advanceTimersByTime(100)
        d.move(102, 101) // < 4px → no reset
        vi.advanceTimersByTime(150) // 250 total since start
        expect(onFire).toHaveBeenCalledTimes(1)
    })

    it('cancel prevents firing', () => {
        const onFire = vi.fn()
        const d = new DwellTracker({ dwellMs: 250, stillPx: 4, onFire })
        d.start(100, 100)
        vi.advanceTimersByTime(100)
        d.cancel()
        vi.advanceTimersByTime(300)
        expect(onFire).not.toHaveBeenCalled()
    })

    it('reports dwell-progress active after the progress delay, cleared on cancel', () => {
        const onProgress = vi.fn()
        const d = new DwellTracker({
            dwellMs: 250,
            stillPx: 4,
            onFire: vi.fn(),
            progressDelayMs: 120,
            onProgress,
        })
        d.start(100, 100)
        vi.advanceTimersByTime(119)
        expect(onProgress).not.toHaveBeenCalledWith(true)
        vi.advanceTimersByTime(1)
        expect(onProgress).toHaveBeenCalledWith(true)
        d.cancel()
        expect(onProgress).toHaveBeenLastCalledWith(false)
    })
})
