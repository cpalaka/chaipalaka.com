import { describe, test, expect } from 'vitest'
import { edges } from './edges'

const ROUTES = ['/', '/lifelog', '/stuff', '/blog'] as const

describe('transitions/edges', () => {
    test('has an entry for every ordered pair of distinct canvas routes', () => {
        for (const from of ROUTES) {
            for (const to of ROUTES) {
                if (from === to) continue
                const key = `${from}→${to}`
                expect(
                    Object.prototype.hasOwnProperty.call(edges, key),
                    `expected edge key "${key}"`,
                ).toBe(true)
            }
        }
    })

    test('has no extra entries beyond the 12 canvas-route pairs', () => {
        expect(Object.keys(edges)).toHaveLength(12)
    })

    test('every entry routes through anchor-slide on the horizontal axis', () => {
        for (const [key, value] of Object.entries(edges)) {
            expect(value.primitive, `${key}.primitive`).toBe('anchor-slide')
            expect(value.axis, `${key}.axis`).toBe('horizontal')
        }
    })

    test('no entry sets sign (must fall back to the history-direction default)', () => {
        for (const [key, value] of Object.entries(edges)) {
            expect(
                'sign' in (value as unknown as Record<string, unknown>),
                `${key} unexpectedly sets sign`,
            ).toBe(false)
        }
    })
})
