import { describe, it, expect, afterEach } from 'vitest'
import { resolvePinHost, childHandlesOf } from './recursion'

afterEach(() => {
    document.body.innerHTML = ''
})

/**
 * Build a minimal v2-layout DOM fixture: a content box with a prose link, and a
 * pin layer holding a root pinned card (whose body carries a link) and,
 * optionally, a child pinned card nested under it (whose body also carries a
 * link). Returns the links by role so tests assert against `resolvePinHost`.
 */
function fixture({ withChild = false }: { withChild?: boolean } = {}) {
    document.body.innerHTML = `
        <div data-layout="contentbox">
          <div data-content-box>
            <div class="content-box__scroll">
              <p>read <a id="prose" data-link-type="portal" href="/blog/x">a link</a></p>
            </div>
          </div>
          <div data-pin-layer>
            <article data-pin-id="pin-0" data-pin-kind="pocket">
              <div class="pin-card__body">
                see <a id="in-root" data-link-type="portal" href="/test/box-b">box b</a>
              </div>
            </article>
            ${
                withChild
                    ? `<article data-pin-id="pin-1" data-pin-kind="portal" data-pin-parent="pin-0">
                         <a id="in-child" class="pin-card__body" data-link-type="portal" href="/blog/y">deeper</a>
                       </article>`
                    : ''
            }
          </div>
          <div data-peek-layer>
            <article data-peek-id="peek-7" data-peek-kind="pocket">
              <div class="peek-preview__body">
                aside <a id="in-preview" data-link-type="portal" href="/blog/z">z</a>
              </div>
            </article>
          </div>
        </div>`
    return (id: string) => document.getElementById(id)!
}

describe('resolvePinHost', () => {
    it('a prose link in the content box is a root pin', () => {
        const el = fixture()
        expect(resolvePinHost(el('prose'))).toEqual({ kind: 'root' })
    })

    it('a link inside a root pinned card is a child of that card', () => {
        const el = fixture()
        expect(resolvePinHost(el('in-root'))).toEqual({
            kind: 'child',
            parentId: 'pin-0',
        })
    })

    it('a link inside a child pinned card is suppressed (one-level cap)', () => {
        const el = fixture({ withChild: true })
        expect(resolvePinHost(el('in-child'))).toEqual({ kind: 'suppress' })
    })

    it('a link inside a held preview is suppressed (previews are ephemeral)', () => {
        const el = fixture()
        expect(resolvePinHost(el('in-preview'))).toEqual({ kind: 'suppress' })
    })

    it('a link outside the box, pins, and previews is suppressed', () => {
        document.body.innerHTML = `<a id="loose" data-link-type="portal" href="/x">x</a>`
        expect(
            resolvePinHost(document.getElementById('loose')!),
        ).toEqual({ kind: 'suppress' })
    })
})

describe('childHandlesOf', () => {
    const resolve = (id: string): number | undefined =>
        ({ 'pin-1': 11, 'pin-2': 12 })[id]

    it('collects handles of entries whose parentId matches', () => {
        const entries = [
            { id: 'pin-0' },
            { id: 'pin-1', parentId: 'pin-0' },
            { id: 'pin-2', parentId: 'pin-0' },
        ]
        expect(childHandlesOf(entries, 'pin-0', resolve)).toEqual([11, 12])
    })

    it('skips children whose body is not yet registered (resolver returns undefined)', () => {
        const entries = [
            { id: 'pin-1', parentId: 'pin-0' },
            { id: 'pin-9', parentId: 'pin-0' }, // unknown to resolver
        ]
        expect(childHandlesOf(entries, 'pin-0', resolve)).toEqual([11])
    })

    it('returns nothing for a parent with no children', () => {
        const entries = [{ id: 'pin-0' }, { id: 'pin-1', parentId: 'other' }]
        expect(childHandlesOf(entries, 'pin-0', resolve)).toEqual([])
    })
})
