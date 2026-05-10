import { describe, test, expect } from 'vitest'
import { PretextRegistry } from './PretextRegistry'

describe('PretextRegistry', () => {
    test('registered fonts are queryable as a canvas font string', () => {
        const r = new PretextRegistry()
        r.register('body', {
            family: 'Newsreader',
            size: 16,
            weight: 400,
            lineHeight: 1.4,
        })
        expect(r.getFont('body')).toBe('400 16px Newsreader')
    })

    test('getFont throws on an unregistered key', () => {
        const r = new PretextRegistry()
        expect(() => r.getFont('mono')).toThrow(/unknown/i)
    })

    test('getLineHeight returns line-height in pixels for a registered key', () => {
        const r = new PretextRegistry()
        r.register('body', {
            family: 'Newsreader',
            size: 16,
            weight: 400,
            lineHeight: 1.4,
        })
        expect(r.getLineHeight('body')).toBeCloseTo(22.4)
    })
})
