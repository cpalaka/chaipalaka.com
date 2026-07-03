/**
 * The Peek lifecycle controller: holds the active preview(s) and their phase,
 * React-agnostic (get/subscribe/mutators — the project's Controller contract).
 *
 * Invariant: at most one **held** preview at a time. Opening a new source
 * dismisses the prior held one (it flings + fades); opening the source that is
 * already held is a no-op, so a re-fired dwell or a jittery hover never
 * re-spawns. The store owns lifecycle only; placement + content ride along as
 * opaque payload the `PreviewCard` consumes.
 */

export type PeekKind = 'portal' | 'pocket' | 'external'
export type PeekPhase = 'held' | 'dismissing'

export interface PreviewSpec {
    /** Identity of the source word/link — the dedup key. */
    sourceId: string
    /** The source word/link element — handed to Keep to anchor the pinned card. */
    sourceEl?: Element
    kind: PeekKind
    /** Set when the trigger lives inside a (root) pinned card: the id of that
     * card, carried through Keep so the resulting pin ropes to it as a child
     * (spec §9 recursion). Unset for a content-box prose link (a root pin). */
    parentId?: string
    /** Card-centre placement in viewport space, and which side of the word. */
    center: { x: number; y: number }
    side: 'left' | 'right'
    width: number
    /** Portal: target title + transcluded lead + href.
     * External (task-029): title = the link text, lead = the authored note (the
     * markdown link title), href = the off-site URL opened in a new tab. */
    title?: string
    lead?: string
    href?: string
    /** External: the attribution line — the target's bare hostname (§9). */
    source?: string
    /** Pocket: the lifted note html (trusted authored content). */
    bodyHtml?: string
}

export interface PreviewEntry extends PreviewSpec {
    id: string
    phase: PeekPhase
}

export class PeekStore {
    private entries = new Map<string, PreviewEntry>()
    private listeners = new Set<() => void>()
    private cached: readonly PreviewEntry[] | null = null
    private seq = 0

    subscribe = (cb: () => void): (() => void) => {
        this.listeners.add(cb)
        return () => {
            this.listeners.delete(cb)
        }
    }

    snapshot = (): readonly PreviewEntry[] => {
        if (!this.cached) this.cached = Object.freeze([...this.entries.values()])
        return this.cached
    }

    /** Spawn a held preview (dismissing any prior held one). Returns its id;
     * if this source is already held, returns the existing id without re-spawning. */
    open(spec: PreviewSpec): string {
        for (const e of this.entries.values()) {
            if (e.phase === 'held' && e.sourceId === spec.sourceId) return e.id
        }
        for (const e of this.entries.values()) {
            if (e.phase === 'held') this.entries.set(e.id, { ...e, phase: 'dismissing' })
        }
        const id = `peek-${spec.sourceId}-${this.seq++}`
        this.entries.set(id, { ...spec, id, phase: 'held' })
        this.invalidate()
        return id
    }

    /** Move a preview from held to dismissing (dismiss → fling + fade out). */
    dismiss(id: string): void {
        const e = this.entries.get(id)
        if (!e || e.phase === 'dismissing') return
        this.entries.set(id, { ...e, phase: 'dismissing' })
        this.invalidate()
    }

    /** Delete a preview entirely (after its fade-out ends). */
    remove(id: string): void {
        if (this.entries.delete(id)) this.invalidate()
    }

    /** Drop every preview — used to reset the ladder on a route change (the
     * source words belong to the page being left). */
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
