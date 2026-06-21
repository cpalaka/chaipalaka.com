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

/** Like {@link usePin} but returns null instead of throwing when there is no
 * `PinProvider` — for shared chrome (the FrameBar settings menu) that renders in
 * both the v2 content-box layout (has pins) and the v1 canvas layout (no pins). */
export function usePinOptional(): PinStore | null {
    return use(PinContext)
}

export function usePinEntries(): readonly PinEntry[] {
    const store = usePin()
    return useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
}
