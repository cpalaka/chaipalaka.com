import { describe, it, expect, beforeEach } from 'vitest'
import {
    serializePins,
    deserializePins,
    restorePinSpecs,
    loadRoute,
    saveRoute,
    hasRoute,
    clearAllRoutes,
    type PersistedPin,
} from './pinPersistence'
import type { PinEntry, PinRuntime } from './PinStore'

const el = () => ({}) as unknown as Element
const entry = (over: Partial<PinEntry> = {}): PinEntry => ({
    id: 'pin-0',
    sourceEl: el(),
    kind: 'portal',
    center: { x: 0, y: 0 },
    width: 240,
    height: 130,
    locator: { href: '/blog', nth: 0 },
    title: 'Writing',
    lead: 'the lead',
    href: '/blog',
    ...over,
})

const rt = (over: Partial<PinRuntime> = {}): PinRuntime => ({
    regime: 'word',
    offset: { dx: 10, dy: 150 },
    ...over,
})

describe('serializePins', () => {
    it('serializes a root pin with its locator, runtime, size and payload', () => {
        const out = serializePins([entry()], () => rt())
        expect(out).toEqual([
            {
                locator: { href: '/blog', nth: 0 },
                kind: 'portal',
                regime: 'word',
                offset: { dx: 10, dy: 150 },
                width: 240,
                height: 130,
                title: 'Writing',
                lead: 'the lead',
                href: '/blog',
            },
        ])
    })

    it('excludes child pins (those with a parentId)', () => {
        const out = serializePins(
            [entry({ id: 'pin-1', parentId: 'pin-0' })],
            () => rt(),
        )
        expect(out).toHaveLength(0)
    })

    it('excludes pins without a locator (e.g. ambient teacher pins)', () => {
        const out = serializePins([entry({ locator: undefined })], () => rt())
        expect(out).toHaveLength(0)
    })

    it('excludes pins whose describer returns null', () => {
        const out = serializePins([entry()], () => null)
        expect(out).toHaveLength(0)
    })

    it('captures the live regime from the describer', () => {
        const out = serializePins([entry()], () => rt({ regime: 'parked-bottom' }))
        expect(out[0]!.regime).toBe('parked-bottom')
    })
})

describe('deserializePins', () => {
    it('round-trips serialized pins through the stored envelope', () => {
        const pins = serializePins([entry()], () => rt())
        const raw = JSON.stringify({ v: 1, pins })
        expect(deserializePins(raw)).toEqual(pins)
    })

    it('returns [] for null, malformed JSON, or a version mismatch', () => {
        expect(deserializePins(null)).toEqual([])
        expect(deserializePins('not json')).toEqual([])
        expect(deserializePins(JSON.stringify({ v: 99, pins: [] }))).toEqual([])
        expect(deserializePins(JSON.stringify({ pins: [] }))).toEqual([])
    })

    it('drops individual malformed records but keeps valid ones', () => {
        const good = serializePins([entry()], () => rt())[0]!
        const raw = JSON.stringify({
            v: 1,
            pins: [good, { kind: 'portal' }, { locator: 'nope' }],
        })
        expect(deserializePins(raw)).toEqual([good])
    })
})

describe('restorePinSpecs', () => {
    const persisted: PersistedPin = {
        locator: { href: '/blog', nth: 0 },
        kind: 'portal',
        regime: 'word',
        offset: { dx: 10, dy: 150 },
        width: 240,
        height: 130,
        title: 'Writing',
        lead: 'the lead',
        href: '/blog',
    }

    it('rebuilds a PinSpec with centre = word centre + offset and the saved regime', () => {
        const word = el()
        const specs = restorePinSpecs([persisted], () => ({
            el: word,
            rect: { left: 100, top: 200, width: 40, height: 20 },
        }))
        expect(specs).toHaveLength(1)
        const s = specs[0]!
        expect(s.sourceEl).toBe(word)
        expect(s.kind).toBe('portal')
        expect(s.locator).toEqual({ href: '/blog', nth: 0 })
        expect(s.initialRegime).toBe('word')
        // word centre = (120, 210); + offset (10, 150)
        expect(s.center).toEqual({ x: 130, y: 360 })
        expect(s.title).toBe('Writing')
    })

    it('drops a pin whose source word no longer resolves (stale → drop)', () => {
        const specs = restorePinSpecs([persisted], () => null)
        expect(specs).toHaveLength(0)
    })
})

describe('per-route localStorage IO', () => {
    beforeEach(() => localStorage.clear())

    it('saveRoute then loadRoute round-trips a route', () => {
        const pins = serializePins([entry()], () => rt())
        saveRoute('/blog', pins)
        expect(loadRoute('/blog')).toEqual(pins)
    })

    it('hasRoute is false before any save, true after (the persisted-wins guard)', () => {
        expect(hasRoute('/blog')).toBe(false)
        saveRoute('/blog', serializePins([entry()], () => rt()))
        expect(hasRoute('/blog')).toBe(true)
    })

    it('scopes storage per route', () => {
        saveRoute('/blog', serializePins([entry()], () => rt()))
        expect(loadRoute('/stuff')).toEqual([])
        expect(hasRoute('/stuff')).toBe(false)
    })

    it('clearAllRoutes removes every pin key, leaving unrelated keys (escape hatch)', () => {
        saveRoute('/blog', serializePins([entry()], () => rt()))
        saveRoute('/stuff', serializePins([entry()], () => rt()))
        localStorage.setItem('chaipalaka.theme', 'dark')
        clearAllRoutes()
        expect(hasRoute('/blog')).toBe(false)
        expect(hasRoute('/stuff')).toBe(false)
        expect(localStorage.getItem('chaipalaka.theme')).toBe('dark')
    })
})
