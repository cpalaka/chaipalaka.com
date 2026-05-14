import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import type { PageDef } from '../routes/PageDef'

export interface PageDefRegistryAPI {
    register(path: string, def: PageDef): void
    unregister(path: string, def: PageDef): void
    resolve(path: string): PageDef | undefined
}

class PageDefRegistryStore implements PageDefRegistryAPI {
    private entries = new Map<string, PageDef>()

    register = (path: string, def: PageDef): void => {
        this.entries.set(path, def)
    }

    // Identity-guarded: only deletes when the entry still matches the def the
    // caller registered. Prevents fast remounts (StrictMode, route swaps) where
    // the incoming mount registers a new def before the outgoing unmount fires.
    unregister = (path: string, def: PageDef): void => {
        if (this.entries.get(path) === def) {
            this.entries.delete(path)
        }
    }

    resolve = (path: string): PageDef | undefined => {
        return this.entries.get(path)
    }
}

const PageDefRegistryContext = createContext<PageDefRegistryAPI | null>(null)

export function PageDefRegistryProvider({ children }: { children: ReactNode }) {
    const [store] = useState(() => new PageDefRegistryStore())
    return (
        <PageDefRegistryContext.Provider value={store}>
            {children}
        </PageDefRegistryContext.Provider>
    )
}

export function usePageDefRegistry(): PageDefRegistryAPI {
    const api = use(PageDefRegistryContext)
    if (!api)
        throw new Error(
            'usePageDefRegistry: must be used inside <PageDefRegistryProvider>',
        )
    return api
}

/**
 * Register a PageDef under the current `location.pathname` for the lifetime of
 * the calling component. Callers are responsible for memoizing `pageDef`
 * (e.g. via `useMemo`) so the effect does not re-run on every parent render.
 */
export function useRegisterPageDef(pageDef: PageDef): void {
    const registry = usePageDefRegistry()
    const { pathname } = useLocation()
    useEffect(() => {
        registry.register(pathname, pageDef)
        return () => {
            registry.unregister(pathname, pageDef)
        }
    }, [registry, pathname, pageDef])
}
