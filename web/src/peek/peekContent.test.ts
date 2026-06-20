import { describe, it, expect } from 'vitest'
import { resolvePortalLead, liftPocketBody, pocketIdFromHref } from './peekContent'

const posts = [
    { slug: 'hello-world', title: 'Hello, World', description: 'The first post.' },
    { slug: 'on-physics', title: 'On Physics', description: 'Ropes and gravity.' },
]

describe('resolvePortalLead', () => {
    it('resolves a /blog/<slug> href to that post title + description', () => {
        expect(resolvePortalLead('/blog/on-physics', posts)).toEqual({
            title: 'On Physics',
            description: 'Ropes and gravity.',
        })
    })

    it('tolerates a trailing slash and a /read suffix', () => {
        expect(resolvePortalLead('/blog/hello-world/', posts)).toEqual({
            title: 'Hello, World',
            description: 'The first post.',
        })
        expect(resolvePortalLead('/blog/hello-world/read', posts)).toEqual({
            title: 'Hello, World',
            description: 'The first post.',
        })
    })

    it('returns null for a non-blog Portal (no lead to transclude)', () => {
        expect(resolvePortalLead('/about', posts)).toBeNull()
    })

    it('returns null for an unknown slug', () => {
        expect(resolvePortalLead('/blog/missing', posts)).toBeNull()
    })
})

describe('pocketIdFromHref', () => {
    it('extracts the footnote id from a reference href', () => {
        expect(pocketIdFromHref('#user-content-fn-3')).toBe('3')
    })
    it('returns null for a non-footnote anchor', () => {
        expect(pocketIdFromHref('#planes')).toBeNull()
    })
})

describe('liftPocketBody', () => {
    function mount(html: string): HTMLElement {
        const root = document.createElement('div')
        root.innerHTML = html
        return root
    }

    const floor = `
        <details class="pocket" data-pocket-id="1" id="user-content-fn-1">
            <summary class="pocket__summary">1</summary>
            <div class="pocket__body"><p>The whole note, lifted.</p></div>
        </details>`

    it('lifts the .pocket__body html for the matching data-pocket-id', () => {
        const root = mount(floor)
        const lifted = liftPocketBody('1', root)
        expect(lifted).not.toBeNull()
        expect(lifted!.bodyHtml).toContain('The whole note, lifted.')
    })

    it('returns null when no disclosure matches', () => {
        const root = mount(floor)
        expect(liftPocketBody('9', root)).toBeNull()
    })
})
