import { describe, test, expect, vi } from 'vitest'
import { bumpRedrop, getRedropKey } from './redropKey'

describe('redrop key', () => {
    test('bump increments the key and notifies subscribers', () => {
        const ctrl = getRedropKey()
        const before = ctrl.get()
        const listener = vi.fn()
        const unsubscribe = ctrl.subscribe(listener)
        bumpRedrop()
        expect(ctrl.get()).toBe(before + 1)
        expect(listener).toHaveBeenCalledWith(before + 1)
        unsubscribe()
    })
})
