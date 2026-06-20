import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PinGesture } from './pinGesture'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function makeGesture(overrides: Record<string, unknown> = {}) {
    const cbs = {
        onArm: vi.fn(),
        onDrag: vi.fn(),
        onDrop: vi.fn(),
        onClick: vi.fn(),
        onAbort: vi.fn(),
    }
    const g = new PinGesture({ armPressMs: 200, armMovePx: 6, ...cbs, ...overrides })
    return { g, ...cbs }
}

describe('PinGesture', () => {
    it('arms after a press-hold of armPressMs with no movement', () => {
        const { g, onArm, onClick } = makeGesture()
        g.down(100, 100)
        vi.advanceTimersByTime(199)
        expect(onArm).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(onArm).toHaveBeenCalledTimes(1)
        expect(onClick).not.toHaveBeenCalled()
    })

    it('arms immediately on movement past armMovePx, before the press timer', () => {
        const { g, onArm, onDrag } = makeGesture()
        g.down(0, 0)
        g.move(10, 0) // 10px > 6 → arm now
        expect(onArm).toHaveBeenCalledTimes(1)
        // the arming move also begins the drag (no lag): delta from the down origin
        expect(onDrag).toHaveBeenCalledWith(10, 0)
    })

    it('is a click (enter) when released before arm and within the move threshold', () => {
        const { g, onArm, onClick } = makeGesture()
        g.down(50, 50)
        g.move(52, 51) // sub-threshold jitter
        vi.advanceTimersByTime(120)
        g.up()
        expect(onClick).toHaveBeenCalledTimes(1)
        expect(onArm).not.toHaveBeenCalled()
    })

    it('aborts (no drag, no click) when the pointer leaves the bar before arm', () => {
        const { g, onArm, onAbort, onClick } = makeGesture()
        g.down(0, 0)
        vi.advanceTimersByTime(120)
        g.leaveBar()
        expect(onAbort).toHaveBeenCalledTimes(1)
        // a later release does not become a click
        g.up()
        expect(onClick).not.toHaveBeenCalled()
        // and the press timer never fires an arm
        vi.advanceTimersByTime(200)
        expect(onArm).not.toHaveBeenCalled()
    })

    it('reports incremental drag deltas after a timer arm', () => {
        const { g, onDrag } = makeGesture()
        g.down(0, 0)
        vi.advanceTimersByTime(200) // arm via timer
        g.move(5, 0)
        g.move(8, 2)
        expect(onDrag).toHaveBeenNthCalledWith(1, 5, 0)
        expect(onDrag).toHaveBeenNthCalledWith(2, 3, 2)
    })

    it('drops (pins) on release after arm, and does not fire a click', () => {
        const { g, onDrop, onClick } = makeGesture()
        g.down(0, 0)
        vi.advanceTimersByTime(200)
        g.move(20, 20)
        g.up()
        expect(onDrop).toHaveBeenCalledTimes(1)
        expect(onClick).not.toHaveBeenCalled()
    })

    it('tolerates sub-threshold jitter and still arms via the timer', () => {
        const { g, onArm } = makeGesture()
        g.down(0, 0)
        g.move(3, 0) // < 6 from origin
        g.move(0, -2) // still < 6 from origin
        vi.advanceTimersByTime(200)
        expect(onArm).toHaveBeenCalledTimes(1)
    })

    it('leaving the bar after arm is harmless — drag continues', () => {
        const { g, onAbort, onDrag } = makeGesture()
        g.down(0, 0)
        vi.advanceTimersByTime(200) // armed
        g.leaveBar()
        expect(onAbort).not.toHaveBeenCalled()
        g.move(4, 0)
        expect(onDrag).toHaveBeenCalledWith(4, 0)
    })
})
