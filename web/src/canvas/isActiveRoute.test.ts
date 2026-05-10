import { describe, test, expect } from 'vitest'
import { isActiveRoute } from './FrameBar'

describe('isActiveRoute', () => {
    test('/ matches / exactly', () => {
        expect(isActiveRoute('/', '/')).toBe(true)
    })

    test('/ does not match /blog (exact match for root)', () => {
        expect(isActiveRoute('/blog', '/')).toBe(false)
    })

    test('/blog matches /blog exactly', () => {
        expect(isActiveRoute('/blog', '/blog')).toBe(true)
    })

    test('/blog/foo matches /blog via prefix', () => {
        expect(isActiveRoute('/blog/foo', '/blog')).toBe(true)
    })

    test('/blogger does not match /blog (no slash boundary)', () => {
        expect(isActiveRoute('/blogger', '/blog')).toBe(false)
    })

    test('/lifelog matches /lifelog exactly', () => {
        expect(isActiveRoute('/lifelog', '/lifelog')).toBe(true)
    })

    test('/lifelog/books/foo matches /lifelog via prefix', () => {
        expect(isActiveRoute('/lifelog/books/foo', '/lifelog')).toBe(true)
    })
})
