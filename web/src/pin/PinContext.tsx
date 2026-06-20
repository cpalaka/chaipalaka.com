import {
    createContext,
    use,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from 'react'
import { PinStore, type PinEntry } from './PinStore'

const PinContext = createContext<PinStore | null>(null)

export function PinProvider({ children }: { children: ReactNode }) {
    const [store] = useState(() => new PinStore())
    return <PinContext.Provider value={store}>{children}</PinContext.Provider>
}

export function usePin(): PinStore {
    const store = use(PinContext)
    if (!store) throw new Error('usePin: must be used inside <PinProvider>')
    return store
}

export function usePinEntries(): readonly PinEntry[] {
    const store = usePin()
    return useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
}
