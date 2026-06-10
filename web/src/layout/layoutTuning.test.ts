import { describe, test, expect, vi } from 'vitest'
import {
    layoutTuning,
    notifyLayoutTuning,
    subscribeLayoutTuning,
} from './layoutTuning'

describe('layoutTuning', () => {
    test('is a flat literal of finite numbers', () => {
        for (const [key, value] of Object.entries(layoutTuning)) {
            expect(typeof value, key).toBe('number')
            expect(Number.isFinite(value), key).toBe(true)
        }
    })

    test('notify reaches subscribers until unsubscribed', () => {
        const listener = vi.fn()
        const unsubscribe = subscribeLayoutTuning(listener)
        notifyLayoutTuning()
        expect(listener).toHaveBeenCalledTimes(1)
        unsubscribe()
        notifyLayoutTuning()
        expect(listener).toHaveBeenCalledTimes(1)
    })
})
