import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react'

/**
 * task-019 spike — a persistent SR route-change announcer.
 *
 * The data router does NOT auto-announce navigations (no global aria-live region
 * exists in the app today), and a View Transition's snapshot overlay must not
 * swallow the announcement. The region lives in the layout so it *persists* across
 * child route swaps — the text updates in place on nav, which is what makes a
 * screen reader announce it. The accessibility tree reads the live DOM, not the
 * VT snapshot image, so the morph leaves the announcement intact.
 */
const AnnouncerContext = createContext<(message: string) => void>(() => {})

export function useAnnounce() {
    return useContext(AnnouncerContext)
}

const srOnly: React.CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
}

export function AnnouncerProvider({ children }: { children: ReactNode }) {
    const [message, setMessage] = useState('')
    const announce = useCallback((m: string) => setMessage(m), [])
    return (
        <AnnouncerContext.Provider value={announce}>
            {children}
            <div role="status" aria-live="polite" style={srOnly}>
                {message}
            </div>
        </AnnouncerContext.Provider>
    )
}
