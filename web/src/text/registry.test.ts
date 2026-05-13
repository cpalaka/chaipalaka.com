import { describe, test, expect } from 'vitest'
import { registry } from './registry'
import { PretextRegistry } from './PretextRegistry'

describe('text/registry', () => {
    test('exports a PretextRegistry instance', () => {
        expect(registry).toBeInstanceOf(PretextRegistry)
    })

    test('registers body, mono, and card-title keys', () => {
        expect(() => registry.getFont('body')).not.toThrow()
        expect(() => registry.getFont('mono')).not.toThrow()
        expect(() => registry.getFont('card-title')).not.toThrow()
    })

    test('throws on an unregistered key (no accidental fallback)', () => {
        expect(() => registry.getFont('does-not-exist')).toThrow(/unknown/i)
    })

    test('body font spec is pinned: 400 16px Newsreader Variable, lh 1.6', () => {
        expect(registry.getFont('body')).toBe('400 16px Newsreader Variable')
        expect(registry.getLineHeight('body')).toBeCloseTo(25.6)
    })

    test('mono font spec is pinned: 400 14px JetBrains Mono Variable, lh 1.6', () => {
        expect(registry.getFont('mono')).toBe(
            '400 14px JetBrains Mono Variable',
        )
        expect(registry.getLineHeight('mono')).toBeCloseTo(22.4)
    })

    test('card-title font spec is pinned: 600 36px Newsreader Variable, lh 1.15', () => {
        expect(registry.getFont('card-title')).toBe(
            '600 36px Newsreader Variable',
        )
        expect(registry.getLineHeight('card-title')).toBeCloseTo(41.4)
    })
})
