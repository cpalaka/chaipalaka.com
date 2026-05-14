import { describe, test, expect, beforeAll } from 'vitest'
import { measure } from './measure'
import { FONT_BODY } from './fonts'

beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = function () {
        let font = ''
        return {
            get font() {
                return font
            },
            set font(v: string) {
                font = v
            },
            measureText: (text: string) => ({ width: text.length * 8 }),
        } as unknown as CanvasRenderingContext2D
    } as unknown as typeof HTMLCanvasElement.prototype.getContext
})

describe('measure', () => {
    test('returns a non-empty MeasuredText for a single short line', () => {
        const r = measure('hello world', FONT_BODY, 1000)
        expect(r.width).toBeGreaterThan(0)
        expect(r.height).toBeGreaterThan(0)
        expect(r.lines).toBe(1)
    })

    test('wraps to more lines when maxWidth shrinks', () => {
        const text = 'this is a longer sentence with several words to wrap'
        const wide = measure(text, FONT_BODY, 1000)
        const narrow = measure(text, FONT_BODY, 80)
        expect(narrow.lines).toBeGreaterThan(wide.lines)
        expect(narrow.height).toBeGreaterThan(wide.height)
    })
})
