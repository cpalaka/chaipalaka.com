export interface MinimizedEntry {
    id: string
    label: string
    kind: string
    fromRect?: DOMRect
}

export interface MinimizedRegistry {
    minimize(id: string, snapshot: Omit<MinimizedEntry, 'id'>): void
    restore(id: string, fromChipRect?: DOMRect): MinimizedEntry | null
    consumeRestoreRect(id: string): DOMRect | null
    list(): MinimizedEntry[]
    subscribe(listener: (entries: MinimizedEntry[]) => void): () => void
}

export function createMinimizedRegistry(): MinimizedRegistry {
    const entries = new Map<string, MinimizedEntry>()
    const pendingRestoreRects = new Map<string, DOMRect>()
    const listeners = new Set<(entries: MinimizedEntry[]) => void>()

    function notify() {
        const snapshot = Array.from(entries.values())
        for (const l of listeners) l(snapshot)
    }

    return {
        minimize(id, snapshot) {
            entries.set(id, { id, ...snapshot })
            notify()
        },

        restore(id, fromChipRect) {
            const entry = entries.get(id)
            if (!entry) return null
            entries.delete(id)
            if (fromChipRect) pendingRestoreRects.set(id, fromChipRect)
            notify()
            return entry
        },

        consumeRestoreRect(id) {
            const rect = pendingRestoreRects.get(id) ?? null
            pendingRestoreRects.delete(id)
            return rect
        },

        list() {
            return Array.from(entries.values())
        },

        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
    }
}
