import { describe, it, expect, beforeEach } from 'vitest'
import { locate, resolve } from './pinLocator'

// Build a content box with the given inner HTML and return it as the resolve root.
function box(html: string): HTMLElement {
    document.body.innerHTML = `<div data-content-box>${html}</div>`
    return document.querySelector('[data-content-box]') as HTMLElement
}

describe('pinLocator', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('round-trips a Portal trigger: locate then resolve returns the same element', () => {
        const root = box('<p>see the <a data-link-type="portal" href="/blog">writing</a></p>')
        const el = root.querySelector('a')!
        const loc = locate(el, root)
        expect(loc).toEqual({ href: '/blog', nth: 0 })
        expect(resolve(loc!, root)).toBe(el)
    })

    it('round-trips a Pocket trigger by its footnote href', () => {
        const root = box('<p>note<sup><a href="#user-content-fn-1">1</a></sup></p>')
        const el = root.querySelector('a')!
        const loc = locate(el, root)
        expect(loc).toEqual({ href: '#user-content-fn-1', nth: 0 })
        expect(resolve(loc!, root)).toBe(el)
    })

    it('disambiguates duplicate hrefs by occurrence index', () => {
        const root = box(
            '<a data-link-type="portal" href="/blog">a</a>' +
                '<a data-link-type="portal" href="/blog">b</a>',
        )
        const [first, second] = [...root.querySelectorAll('a')]
        expect(locate(first!, root)).toEqual({ href: '/blog', nth: 0 })
        expect(locate(second!, root)).toEqual({ href: '/blog', nth: 1 })
        expect(resolve({ href: '/blog', nth: 1 }, root)).toBe(second)
    })

    it('returns null from resolve when the source word is gone (stale)', () => {
        const root = box('<p>just prose, no link</p>')
        expect(resolve({ href: '/blog', nth: 0 }, root)).toBeNull()
    })

    it('returns null from resolve when the occurrence index no longer exists', () => {
        const root = box('<a data-link-type="portal" href="/blog">only one</a>')
        expect(resolve({ href: '/blog', nth: 1 }, root)).toBeNull()
    })

    it('returns null from locate for a non-trigger element (no href)', () => {
        const root = box('<p>plain <em>emphasis</em></p>')
        const el = root.querySelector('em')!
        expect(locate(el, root)).toBeNull()
    })

    it('returns null from locate for an href that is not a Ladder trigger', () => {
        const root = box('<a href="/plain-link">prose link</a>')
        const el = root.querySelector('a')!
        expect(locate(el, root)).toBeNull()
    })
})
