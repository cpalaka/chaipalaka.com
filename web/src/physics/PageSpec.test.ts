import { describe, test, expect } from 'vitest'
import { buoyancyForKind } from './PageSpec'

describe('buoyancyForKind', () => {
    test('note kind returns balloon', () => {
        expect(buoyancyForKind('note')).toBe('balloon')
    })

    test('blog kind returns heavy', () => {
        expect(buoyancyForKind('blog')).toBe('heavy')
    })

    test('headline kind returns heavy', () => {
        expect(buoyancyForKind('headline')).toBe('heavy')
    })

    test('lifelog kind returns heavy', () => {
        expect(buoyancyForKind('lifelog')).toBe('heavy')
    })

    test('portfolio kind returns heavy', () => {
        expect(buoyancyForKind('portfolio')).toBe('heavy')
    })

    test('link kind returns heavy', () => {
        expect(buoyancyForKind('link')).toBe('heavy')
    })
})
