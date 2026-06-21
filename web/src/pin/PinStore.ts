/**
 * The Keep lifecycle controller: holds the set of **pinned cards** — persistent
 * full-physics cards strung to their source word (spec §3/§5). React-agnostic
 * (get/subscribe/mutators — the project's Controller contract), mirroring
 * `PeekStore`. The store owns identity + payload only; each `PinnedCard` does the
 * physics (anchor body, runtime tether, scroll-tracking, wobble) from its entry.
 *
 * Unlike `PeekStore` there is no single-active invariant: many cards can be
 * pinned at once. A pin is created by the Keep gesture converting a held preview
 * (`PreviewCard` → `usePin().pin(...)`) and removed on dismiss/unmount.
 */

import type { Regime } from './scrollRegime'
import type { PinLocator } from './pinLocator'

export type PinKind = 'portal' | 'pocket'

/** A pinned card's live, serializable runtime — the regime it is in and its card
 * centre **relative to its source word** (scroll-invariant while word-anchored).
 * Reported by each `PinnedCard` via a describer and pulled at save time so
 * persistence never has to measure the DOM during a nav (task-028). */
export interface PinRuntime {
    regime: Regime
    offset: { dx: number; dy: number }
}

export interface PinSpec {
    /** The source word/link element — the word-anchor target + wobble/highlight host. */
    sourceEl: Element
    kind: PinKind
    /** Serializable identity of the source word, for per-route persistence
     * (task-028). Set on user keeps + restored pins; absent on ambient pins
     * (which never persist) and unlocatable sources. */
    locator?: PinLocator
    /** Regime to start in on restore (task-028). Absent ⇒ 'word'; a parked value
     * makes the card re-park to that edge on mount. */
    initialRegime?: Regime
    /** Set when this pin was kept from a link *inside* another pinned card: the
     * id of that parent card. A child pin ropes to the parent **card** (not a
     * word) via the generic card-parent Tether (spec §9, one level deep). */
    parentId?: string
    /** Drop position (card centre) in viewport space. */
    center: { x: number; y: number }
    width: number
    height: number
    /** Drop velocity (fling) imparted by the keep-drag, if any. */
    vx?: number
    vy?: number
    /** Portal: target title + transcluded lead + href. */
    title?: string
    lead?: string
    href?: string
    /** Pocket: the lifted note html (trusted authored content). */
    bodyHtml?: string
}

export interface PinEntry extends PinSpec {
    id: string
}

export class PinStore {
    private entries = new Map<string, PinEntry>()
    private listeners = new Set<() => void>()
    private cached: readonly PinEntry[] | null = null
    private seq = 0
    // Describers report each live card's `PinRuntime` on demand (task-028).
    // Kept off the React snapshot — pulling one never re-renders.
    private describers = new Map<string, () => PinRuntime | null>()

    subscribe = (cb: () => void): (() => void) => {
        this.listeners.add(cb)
        return () => {
            this.listeners.delete(cb)
        }
    }

    snapshot = (): readonly PinEntry[] => {
        if (!this.cached) this.cached = Object.freeze([...this.entries.values()])
        return this.cached
    }

    /** Pin a card; returns its id. */
    pin(spec: PinSpec): string {
        const id = `pin-${this.seq++}`
        this.entries.set(id, { ...spec, id })
        this.invalidate()
        return id
    }

    /** Remove a pinned card. */
    unpin(id: string): void {
        this.describers.delete(id)
        if (this.entries.delete(id)) this.invalidate()
    }

    /** Register a card's runtime describer (task-028); replaced if re-set. */
    setDescriber(id: string, fn: () => PinRuntime | null): void {
        this.describers.set(id, fn)
    }

    /** Pull a card's current runtime, or null if none registered / unavailable. */
    describe(id: string): PinRuntime | null {
        return this.describers.get(id)?.() ?? null
    }

    /** Drop every pinned card — used to reset the ladder on a route change (a
     * pin is strung to a source word on the page being left; persisted per-route
     * pins are a future enhancement, task-028). */
    clear(): void {
        this.describers.clear()
        if (this.entries.size === 0) return
        this.entries.clear()
        this.invalidate()
    }

    private invalidate(): void {
        this.cached = null
        this.listeners.forEach((cb) => cb())
    }
}
