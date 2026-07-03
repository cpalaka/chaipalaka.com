import {
    createContext,
    use,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from 'react'
import type { Buoyancy, ParentRef } from '../physics/PageSpec'
import type { CardContent } from './Page'

export type CardLifecycle = 'spawning' | 'active' | 'exiting'

export interface CardEntry {
    id: string
    parent: ParentRef
    trail?: ParentRef
    kind: string
    buoyancy: Buoyancy
    anchor: { x: number; y: number }
    content: CardContent
    state: CardLifecycle
}

export type RegisterArgs = Omit<CardEntry, 'state'>

export interface CardActivator {
    activate(id: string): void
}

export interface CardRegistryAPI extends CardActivator {
    register(entry: RegisterArgs): void
    requestUnregister(id: string): void
    markExiting(id: string): void
    arm(): void
    disarm(): void
    release(id: string): void
    snapshot(): readonly CardEntry[]
    subscribe(cb: () => void): () => void
}

export class CardRegistryStore {
    private entries = new Map<string, CardEntry>()
    private listeners = new Set<() => void>()
    private cachedSnapshot: readonly CardEntry[] | null = null
    private armed = false

    subscribe = (cb: () => void): (() => void) => {
        this.listeners.add(cb)
        return () => {
            this.listeners.delete(cb)
        }
    }

    snapshot = (): readonly CardEntry[] => {
        if (!this.cachedSnapshot) {
            this.cachedSnapshot = Object.freeze([...this.entries.values()])
        }
        return this.cachedSnapshot
    }

    register = (args: RegisterArgs): void => {
        const existing = this.entries.get(args.id)
        const state: CardLifecycle = existing?.state ?? 'spawning'
        this.entries.set(args.id, { ...args, state })
        this.invalidate()
        if (!existing && !this.armed) {
            queueMicrotask(() => {
                const e = this.entries.get(args.id)
                if (e?.state === 'spawning') this.activate(args.id)
            })
        }
    }

    arm = (): void => {
        this.armed = true
    }

    disarm = (): void => {
        this.armed = false
        // Sweep any cards left in 'spawning' that the active transition's
        // primitive didn't activate (typical for routes whose card set
        // materialises asynchronously after the Director has already
        // dispatched). Without this, they render visibility:hidden forever.
        for (const [id, e] of this.entries) {
            if (e.state === 'spawning') this.activate(id)
        }
    }

    activate = (id: string): void => {
        const e = this.entries.get(id)
        if (!e) {
            throw new Error(
                `CardRegistry.activate: no entry for id "${id}"`,
            )
        }
        if (e.state !== 'spawning') {
            throw new Error(
                `CardRegistry.activate: illegal transition ${e.state} → active for id "${id}"`,
            )
        }
        this.entries.set(id, { ...e, state: 'active' })
        this.invalidate()
    }

    requestUnregister = (id: string): void => {
        const e = this.entries.get(id)
        if (!e) return
        if (e.state === 'exiting') return
        this.entries.delete(id)
        this.invalidate()
    }

    markExiting = (id: string): void => {
        const e = this.entries.get(id)
        if (!e || e.state === 'exiting') return
        this.entries.set(id, { ...e, state: 'exiting' })
        this.invalidate()
    }

    release = (id: string): void => {
        if (!this.entries.has(id)) return
        this.entries.delete(id)
        this.invalidate()
    }

    private invalidate(): void {
        this.cachedSnapshot = null
        this.listeners.forEach((cb) => cb())
    }
}

const CardRegistryContext = createContext<CardRegistryAPI | null>(null)

export function CardRegistryProvider({ children }: { children: ReactNode }) {
    const [store] = useState(() => new CardRegistryStore())
    return (
        <CardRegistryContext.Provider value={store}>
            {children}
        </CardRegistryContext.Provider>
    )
}

export function useCardRegistry(): CardRegistryAPI {
    const api = use(CardRegistryContext)
    if (!api)
        throw new Error(
            'useCardRegistry: must be used inside <CardRegistryProvider>',
        )
    return api
}

export function useCardRegistryEntries(): readonly CardEntry[] {
    const api = useCardRegistry()
    return useSyncExternalStore(api.subscribe, api.snapshot, api.snapshot)
}
