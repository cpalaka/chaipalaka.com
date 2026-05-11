import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { flipMorph } from './flip'

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
    return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect
}

function makeTarget(rect: DOMRect): HTMLElement {
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect)
    return el
}

const mockAnimation = { finished: Promise.resolve() } as unknown as Animation

// happy-dom 20 does not implement Element.prototype.animate — install a stub so vi.spyOn can wrap it.
if (typeof HTMLElement.prototype.animate !== 'function') {
    HTMLElement.prototype.animate = () => mockAnimation
}

describe('flipMorph', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let animateSpy: any

    beforeEach(() => {
        animateSpy = vi.spyOn(HTMLElement.prototype, 'animate').mockReturnValue(mockAnimation)
    })

    afterEach(() => {
        animateSpy.mockRestore()
    })

    function lastCall(): [Keyframe[], KeyframeAnimationOptions] {
        return animateSpy.mock.calls[0] as [Keyframe[], KeyframeAnimationOptions]
    }

    test('FROM keyframe encodes card-to-chip translate and scale', () => {
        // fromRect: card at (100,100) 300×200; chip at (10,500) 60×40
        // dx = 100-10 = 90, dy = 100-500 = -400, scaleX = 300/60 = 5, scaleY = 200/40 = 5
        const fromRect = makeRect(100, 100, 300, 200)
        const target = makeTarget(makeRect(10, 500, 60, 40))

        flipMorph(fromRect, target)

        const [keyframes] = lastCall()
        expect(keyframes[0]?.transform).toBe('translate(90px, -400px) scale(5, 5)')
        expect(keyframes[0]?.transformOrigin).toBe('0 0')
    })

    test('TO keyframe is translate(0,0) scale(1,1) by default', () => {
        flipMorph(makeRect(100, 100, 300, 200), makeTarget(makeRect(10, 500, 60, 40)))

        const [keyframes] = lastCall()
        expect(keyframes[1]?.transform).toBe('translate(0, 0) scale(1, 1)')
        expect(keyframes[1]?.transformOrigin).toBe('0 0')
        expect(keyframes[1]?.opacity).toBe('1')
    })

    test('endTransform option overrides the TO keyframe transform', () => {
        flipMorph(makeRect(0, 0, 100, 100), makeTarget(makeRect(50, 50, 100, 100)), {
            endTransform: 'translate(42px, 99px) rotate(0.1rad)',
        })

        const [keyframes] = lastCall()
        expect(keyframes[1]?.transform).toBe('translate(42px, 99px) rotate(0.1rad)')
    })

    test('opacityFrom defaults to 0.85', () => {
        flipMorph(makeRect(0, 0, 100, 100), makeTarget(makeRect(0, 0, 100, 100)))

        const [keyframes] = lastCall()
        expect(keyframes[0]?.opacity).toBe('0.85')
    })

    test('opacityFrom option propagates to FROM keyframe', () => {
        flipMorph(makeRect(0, 0, 100, 100), makeTarget(makeRect(0, 0, 100, 100)), { opacityFrom: 0.5 })

        const [keyframes] = lastCall()
        expect(keyframes[0]?.opacity).toBe('0.5')
    })

    test('defaults to 340ms duration and material ease', () => {
        flipMorph(makeRect(0, 0, 100, 100), makeTarget(makeRect(0, 0, 100, 100)))

        const [, opts] = lastCall()
        expect(opts.duration).toBe(340)
        expect(opts.easing).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
    })

    test('custom duration and easing propagate to animate options', () => {
        flipMorph(makeRect(0, 0, 100, 100), makeTarget(makeRect(0, 0, 100, 100)), {
            duration: 200,
            easing: 'ease-out',
        })

        const [, opts] = lastCall()
        expect(opts.duration).toBe(200)
        expect(opts.easing).toBe('ease-out')
    })

    test('returns the Animation returned by animate()', () => {
        const result = flipMorph(makeRect(0, 0, 100, 100), makeTarget(makeRect(0, 0, 100, 100)))
        expect(result).toBe(mockAnimation)
    })
})
