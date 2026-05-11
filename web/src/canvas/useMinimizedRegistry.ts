import { useEffect, useState } from 'react'
import { createMinimizedRegistry } from './MinimizedRegistry'
import type { MinimizedEntry, MinimizedRegistry } from './MinimizedRegistry'

// Singleton — one registry per module load, lives for the duration of the session.
// Guards against SSG/SSR (no window) by lazy-creating on first hook use.
let registryInstance: MinimizedRegistry | null = null

function getInstance(): MinimizedRegistry {
    if (!registryInstance) registryInstance = createMinimizedRegistry()
    return registryInstance
}

export function useMinimizedEntries(): MinimizedEntry[] {
    const reg = getInstance()
    const [entries, setEntries] = useState(() => reg.list())

    useEffect(() => {
        return reg.subscribe(setEntries)
    }, [reg])

    return entries
}

// Per-card hook — only re-renders the card whose minimize state actually changed.
export function useIsMinimized(id: string | undefined): boolean {
    const reg = getInstance()
    const [minimized, setMinimized] = useState(() =>
        id !== undefined ? reg.list().some((e) => e.members.includes(id)) : false,
    )

    useEffect(() => {
        if (!id) return
        return reg.subscribe((entries) => {
            setMinimized(entries.some((e) => e.members.includes(id)))
        })
    }, [reg, id])

    return minimized
}

export function useMinimizedRegistry(): MinimizedRegistry {
    return getInstance()
}
