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

export type PinKind = 'portal' | 'pocket'

export interface PinSpec {
    /** The source word/link element — the word-anchor target + wobble/highlight host. */
    sourceEl: Element
    kind: PinKind
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
        if (this.entries.delete(id)) this.invalidate()
    }

    /** Drop every pinned card — used to reset the ladder on a route change (a
     * pin is strung to a source word on the page being left; persisted per-route
     * pins are a future enhancement, task-028). */
    clear(): void {
        if (this.entries.size === 0) return
        this.entries.clear()
        this.invalidate()
    }

    private invalidate(): void {
        this.cached = null
        this.listeners.forEach((cb) => cb())
    }
}
