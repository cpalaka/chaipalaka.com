/**
 * Persisted per-route pins (task-028; spec §7 fast-follow). Serializes a route's
 * **user-kept** pinned cards to localStorage and restores them on the next visit.
 *
 * What persists: the **pin locator** (which word), the regime, the card's offset
 * from its word, size, and payload — root pins only (children re-keep inside a
 * restored parent), excluding ambient teacher pins (they carry no locator). The
 * regime + offset come from each card's runtime *describer* (`PinStore.describe`),
 * which caches a scroll-invariant value so save works even mid-navigation when the
 * source words have already left the DOM.
 *
 * Staleness policy (spec §7): a pin whose source word no longer resolves on reload
 * is **dropped silently** — no crash, no edge-park. localStorage data is schema-
 * versioned and minimal (no derivable fields beyond payload).
 *
 * Pure core (serialize / deserialize / restore) is DOM- and storage-free for
 * headless unit tests; the thin IO wrappers guard `localStorage` for SSR/prerender.
 */

import type { PinEntry, PinKind, PinSpec, PinRuntime } from './PinStore'
import type { PinLocator } from './pinLocator'
import type { Regime } from './scrollRegime'

const SCHEMA_VERSION = 1
const KEY_PREFIX = 'chaipalaka.pins:'
const KINDS: readonly PinKind[] = ['portal', 'pocket']
const REGIMES: readonly Regime[] = ['word', 'parked-top', 'parked-bottom']

export interface PersistedPin {
    locator: PinLocator
    kind: PinKind
    regime: Regime
    offset: { dx: number; dy: number }
    width: number
    height: number
    title?: string
    lead?: string
    href?: string
    bodyHtml?: string
}

/** The word's current rect (viewport space), as `restorePinSpecs` consumes it. */
export interface ResolvedWord {
    el: Element
    rect: { left: number; top: number; width: number; height: number }
}

/**
 * Build the persistable records for a route from the live store. Keeps only root
 * pins (no `parentId`) that have a locator and a current runtime — i.e. user
 * keeps, never ambient teachers (no locator) or children.
 */
export function serializePins(
    entries: readonly PinEntry[],
    describe: (id: string) => PinRuntime | null,
): PersistedPin[] {
    const out: PersistedPin[] = []
    for (const e of entries) {
        if (e.parentId !== undefined || !e.locator) continue
        const rt = describe(e.id)
        if (!rt) continue
        out.push({
            locator: e.locator,
            kind: e.kind,
            regime: rt.regime,
            offset: rt.offset,
            width: e.width,
            height: e.height,
            title: e.title,
            lead: e.lead,
            href: e.href,
            bodyHtml: e.bodyHtml,
        })
    }
    return out
}

function isValid(p: unknown): p is PersistedPin {
    if (typeof p !== 'object' || p === null) return false
    const r = p as Record<string, unknown>
    const loc = r.locator as Record<string, unknown> | undefined
    const off = r.offset as Record<string, unknown> | undefined
    return (
        !!loc &&
        typeof loc.href === 'string' &&
        typeof loc.nth === 'number' &&
        KINDS.includes(r.kind as PinKind) &&
        REGIMES.includes(r.regime as Regime) &&
        !!off &&
        typeof off.dx === 'number' &&
        typeof off.dy === 'number' &&
        typeof r.width === 'number' &&
        typeof r.height === 'number'
    )
}

/** Parse a stored route blob into records, dropping malformed input entirely and
 * malformed records individually. Returns [] on null / bad JSON / version skew. */
export function deserializePins(raw: string | null): PersistedPin[] {
    if (!raw) return []
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return []
    }
    if (typeof parsed !== 'object' || parsed === null) return []
    const env = parsed as Record<string, unknown>
    if (env.v !== SCHEMA_VERSION || !Array.isArray(env.pins)) return []
    return env.pins.filter(isValid)
}

/**
 * Re-resolve persisted records against the live DOM into `PinSpec`s. Each card's
 * centre is its word's current centre plus the saved offset; `initialRegime`
 * carries the saved regime so the card re-parks on mount. Stale pins (word gone)
 * are dropped.
 */
export function restorePinSpecs(
    pins: readonly PersistedPin[],
    resolve: (locator: PinLocator) => ResolvedWord | null,
): PinSpec[] {
    const out: PinSpec[] = []
    for (const p of pins) {
        const r = resolve(p.locator)
        if (!r) continue
        const wordCx = r.rect.left + r.rect.width / 2
        const wordCy = r.rect.top + r.rect.height / 2
        out.push({
            sourceEl: r.el,
            kind: p.kind,
            locator: p.locator,
            initialRegime: p.regime,
            center: { x: wordCx + p.offset.dx, y: wordCy + p.offset.dy },
            width: p.width,
            height: p.height,
            title: p.title,
            lead: p.lead,
            href: p.href,
            bodyHtml: p.bodyHtml,
        })
    }
    return out
}

const routeKey = (pathname: string): string => KEY_PREFIX + pathname

/** A persisted entry exists for this route — the "persisted wins" guard that
 * suppresses ambient seeding. */
export function hasRoute(pathname: string): boolean {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(routeKey(pathname)) !== null
}

export function loadRoute(pathname: string): PersistedPin[] {
    if (typeof localStorage === 'undefined') return []
    return deserializePins(localStorage.getItem(routeKey(pathname)))
}

export function saveRoute(pathname: string, pins: PersistedPin[]): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(
        routeKey(pathname),
        JSON.stringify({ v: SCHEMA_VERSION, pins }),
    )
}
