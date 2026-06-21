import { describe, it, expect } from 'vitest'
import { buildAmbientPinSpecs, type AmbientPinSpec, type Resolved } from './ambientPins'

// A fake source <a> element — only identity matters for the pure builder.
const fakeEl = (tag: string): Element => ({ tagName: tag }) as unknown as Element

// Resolver backed by a fixed map of selector → {el, rect}.
function resolverFrom(
    map: Record<string, Resolved>,
): (selector: string) => Resolved | null {
    return (selector) => map[selector] ?? null
}

const portalSpec: AmbientPinSpec = {
    selector: 'a[href="/blog"]',
    kind: 'portal',
    title: 'Writing',
    lead: 'Essays and notes.',
    href: '/blog',
}

describe('buildAmbientPinSpecs (ambient-teacher seeding)', () => {
    it('seeds nothing when the route rests quiet', () => {
        const resolve = resolverFrom({
            'a[href="/blog"]': { el: fakeEl('A'), rect: { left: 0, top: 0, width: 50, height: 20 } },
        })
        expect(buildAmbientPinSpecs('quiet', [portalSpec], resolve)).toEqual([])
    })

    it('seeds nothing when resting is undefined (defaults to quiet)', () => {
        const resolve = resolverFrom({
            'a[href="/blog"]': { el: fakeEl('A'), rect: { left: 0, top: 0, width: 50, height: 20 } },
        })
        expect(buildAmbientPinSpecs(undefined, [portalSpec], resolve)).toEqual([])
    })

    it('seeds a pin per resolvable spec when the route is populated', () => {
        const el = fakeEl('A')
        const resolve = resolverFrom({
            // word box: left 100, top 200, 60 wide, 20 tall → bottom-centre (130, 220)
            'a[href="/blog"]': { el, rect: { left: 100, top: 200, width: 60, height: 20 } },
        })
        const out = buildAmbientPinSpecs('populated', [portalSpec], resolve)
        expect(out).toHaveLength(1)
        const pin = out[0]!
        expect(pin.sourceEl).toBe(el)
        expect(pin.kind).toBe('portal')
        expect(pin.title).toBe('Writing')
        expect(pin.lead).toBe('Essays and notes.')
        expect(pin.href).toBe('/blog')
        // default size, and the card hangs below the word's bottom-centre.
        expect(pin.width).toBeGreaterThan(0)
        expect(pin.height).toBeGreaterThan(0)
        expect(pin.center.x).toBe(130) // 100 + 60/2 + offset.x(0)
        expect(pin.center.y).toBeGreaterThan(220) // below the word bottom (200+20)
    })

    it('applies per-spec width/height/offset overrides', () => {
        const resolve = resolverFrom({
            'a[href="/blog"]': { el: fakeEl('A'), rect: { left: 100, top: 200, width: 60, height: 20 } },
        })
        const out = buildAmbientPinSpecs(
            'populated',
            [{ ...portalSpec, width: 300, height: 180, offset: { x: 40, y: 100 } }],
            resolve,
        )
        const pin = out[0]!
        expect(pin.width).toBe(300)
        expect(pin.height).toBe(180)
        expect(pin.center.x).toBe(170) // 130 + 40
        expect(pin.center.y).toBe(320) // word bottom 220 + 100
    })

    it('skips specs whose source word is not in the DOM', () => {
        const resolve = resolverFrom({}) // nothing resolves
        expect(buildAmbientPinSpecs('populated', [portalSpec], resolve)).toEqual([])
    })

    it('carries a pocket bodyHtml through unchanged', () => {
        const resolve = resolverFrom({
            '.note': { el: fakeEl('A'), rect: { left: 0, top: 0, width: 10, height: 10 } },
        })
        const out = buildAmbientPinSpecs(
            'populated',
            [{ selector: '.note', kind: 'pocket', bodyHtml: '<p>hi</p>' }],
            resolve,
        )
        expect(out[0]!.kind).toBe('pocket')
        expect(out[0]!.bodyHtml).toBe('<p>hi</p>')
    })
})
