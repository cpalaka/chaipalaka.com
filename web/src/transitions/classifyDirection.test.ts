import { describe, test, expect } from 'vitest'
import { classifyDirection } from './classifyDirection'

describe('classifyDirection', () => {
    test('PUSH classifies as forward', () => {
        expect(classifyDirection('PUSH')).toBe('forward')
    })

    test('POP classifies as back', () => {
        expect(classifyDirection('POP')).toBe('back')
    })

    test('REPLACE classifies as sibling', () => {
        expect(classifyDirection('REPLACE')).toBe('sibling')
    })
})
