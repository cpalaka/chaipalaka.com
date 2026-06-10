import { describe, test, expect, vi, afterEach } from 'vitest'
import {
    getArrangeMode,
    setArrangeMode,
    reportArrangeDrag,
    subscribeArrangeDrag,
} from './arrangeMode'

afterEach(() => {
    setArrangeMode(false)
})

describe('arrange mode seam', () => {
    test('flag toggles and notifies subscribers', () => {
        const ctrl = getArrangeMode()
        expect(ctrl.get()).toBe(false)
        const listener = vi.fn()
        const unsubscribe = ctrl.subscribe(listener)
        setArrangeMode(true)
        expect(ctrl.get()).toBe(true)
        expect(listener).toHaveBeenCalledWith(true)
        unsubscribe()
    })

    test('drag reports reach subscribers until unsubscribed', () => {
        const listener = vi.fn()
        const unsubscribe = subscribeArrangeDrag(listener)
        reportArrangeDrag({ id: 'card-1', x: 10, y: 20, type: 'down' })
        expect(listener).toHaveBeenCalledWith({
            id: 'card-1',
            x: 10,
            y: 20,
            type: 'down',
        })
        unsubscribe()
        reportArrangeDrag({ id: 'card-1', x: 30, y: 40, type: 'move' })
        expect(listener).toHaveBeenCalledTimes(1)
    })
})
