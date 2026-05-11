export interface MinimizedEntry {
    id: string
    label: string
    kind: string
    fromRect?: DOMRect
    members: string[]
    subtreeSize: number
}

export interface MinimizedRegistry {
    minimize(id: string, snapshot: Omit<MinimizedEntry, 'id' | 'members' | 'subtreeSize'>): void
    restore(id: string, fromChipRect?: DOMRect): MinimizedEntry | null
    consumeRestoreRect(id: string): DOMRect | null
    list(): MinimizedEntry[]
    subscribe(listener: (entries: MinimizedEntry[]) => void): () => void
    registerString(cardId: string, parentId: string): void
    unregisterString(cardId: string): void
}

export function createMinimizedRegistry(): MinimizedRegistry {
    const entries = new Map<string, MinimizedEntry>()
    const pendingRestoreRects = new Map<string, DOMRect>()
    const listeners = new Set<(entries: MinimizedEntry[]) => void>()
    const parents = new Map<string, string>()
    const children = new Map<string, Set<string>>()

    function notify() {
        const snapshot = Array.from(entries.values())
        for (const l of listeners) l(snapshot)
    }

    function subtree(rootId: string): string[] {
        const result: string[] = []
        const queue = [rootId]
        while (queue.length > 0) {
            const id = queue.shift()!
            result.push(id)
            const kids = children.get(id)
            if (kids) for (const c of kids) queue.push(c)
        }
        return result
    }

    return {
        registerString(cardId, parentId) {
            parents.set(cardId, parentId)
            if (!children.has(parentId)) children.set(parentId, new Set())
            children.get(parentId)!.add(cardId)
        },

        unregisterString(cardId) {
            const parentId = parents.get(cardId)
            if (parentId !== undefined) {
                children.get(parentId)?.delete(cardId)
                parents.delete(cardId)
            }
            children.delete(cardId)
        },

        minimize(id, snapshot) {
            const members = subtree(id)
            entries.set(id, { id, ...snapshot, members, subtreeSize: members.length })
            notify()
        },

        restore(id, fromChipRect) {
            const entry = entries.get(id)
            if (!entry) return null
            entries.delete(id)
            if (fromChipRect) {
                for (const memberId of entry.members) {
                    pendingRestoreRects.set(memberId, fromChipRect)
                }
            }
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
