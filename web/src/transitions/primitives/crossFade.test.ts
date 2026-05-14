import { describe, test, expect, beforeEach } from 'vitest'
import { crossFade } from './crossFade'
import type { CardActivator } from '../../card/CardRegistry'

const noopActivator: CardActivator = { activate: () => {} }

describe('crossFade', () => {
    let el: HTMLElement
    beforeEach(() => {
        el = document.createElement('div')
        document.body.appendChild(el)
    })

    test('starts at opacity 0 and reaches 1 over the duration', () => {
        const step = crossFade(el, noopActivator, [], { durationMs: 150 })

        step(0)
        expect(parseFloat(el.style.opacity)).toBeCloseTo(0, 2)

        step(75)
        expect(parseFloat(el.style.opacity)).toBeCloseTo(0.5, 1)

        const done = step(75)
        expect(parseFloat(el.style.opacity)).toBeCloseTo(1, 2)
        expect(done).toBe(true)
    })

    test('clamps opacity at 1 if step overshoots the duration', () => {
        const step = crossFade(el, noopActivator, [], { durationMs: 150 })
        const done = step(500)
        expect(parseFloat(el.style.opacity)).toBe(1)
        expect(done).toBe(true)
    })

    test('default duration is 150ms', () => {
        const step = crossFade(el, noopActivator, [])
        step(0)
        const done = step(150)
        expect(done).toBe(true)
    })

    test('lifecycle: activate(id) is called synchronously for each toId on first step (I-1)', () => {
        const called: string[] = []
        const activator: CardActivator = {
            activate: (id) => called.push(id),
        }
        const step = crossFade(el, activator, ['a', 'b'], { durationMs: 100 })
        expect(called).toEqual([])
        step(0)
        expect(called).toEqual(['a', 'b'])
        // Subsequent ticks must not re-activate.
        step(50)
        expect(called).toEqual(['a', 'b'])
    })
})
