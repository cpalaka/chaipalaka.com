import {
    createContext,
    use,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from 'react'
import { PeekStore, type PreviewEntry } from './PeekStore'

const PeekContext = createContext<PeekStore | null>(null)

export function PeekProvider({ children }: { children: ReactNode }) {
    const [store] = useState(() => new PeekStore())
    return <PeekContext.Provider value={store}>{children}</PeekContext.Provider>
}

export function usePeek(): PeekStore {
    const store = use(PeekContext)
    if (!store)
        throw new Error('usePeek: must be used inside <PeekProvider>')
    return store
}

export function usePeekEntries(): readonly PreviewEntry[] {
    const store = usePeek()
    return useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
}
