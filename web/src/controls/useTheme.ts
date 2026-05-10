import { useEffect, useState } from 'react'
import { createThemeController, THEME_STORAGE_KEY } from './theme'
import type { Theme } from './theme'

function makeStorage(): Map<string, string> {
    const m = new Map<string, string>()
    if (typeof localStorage !== 'undefined') {
        const persisted = localStorage.getItem(THEME_STORAGE_KEY)
        if (persisted) m.set(THEME_STORAGE_KEY, persisted)
        const original = m.set.bind(m)
        m.set = (k, v) => {
            localStorage.setItem(k, v)
            return original(k, v)
        }
    }
    return m
}

let controllerInstance: ReturnType<typeof createThemeController> | null = null

function getController() {
    if (!controllerInstance) {
        controllerInstance = createThemeController({ storage: makeStorage() })
    }
    return controllerInstance
}

export function useTheme(): { theme: Theme; cycleTheme: () => void } {
    const ctrl = getController()
    const [theme, setTheme] = useState(() => ctrl.getTheme())

    useEffect(() => {
        const unsub = ctrl.subscribe((t) => {
            setTheme(t)
            if (typeof document !== 'undefined') {
                const dt = ctrl.getDataTheme()
                if (dt) {
                    document.documentElement.dataset.theme = dt
                } else {
                    delete document.documentElement.dataset.theme
                }
            }
        })
        // Apply on mount too
        const dt = ctrl.getDataTheme()
        if (typeof document !== 'undefined') {
            if (dt) {
                document.documentElement.dataset.theme = dt
            } else {
                delete document.documentElement.dataset.theme
            }
        }
        return unsub
    }, [ctrl])

    return { theme, cycleTheme: () => ctrl.cycleTheme() }
}

export type { Theme }
