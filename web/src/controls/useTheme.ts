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

function readSystemPreference(): Theme {
    if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
}

let controllerInstance: ReturnType<typeof createThemeController> | null = null

function getController() {
    if (!controllerInstance) {
        controllerInstance = createThemeController({
            storage: makeStorage(),
            getSystemPreference: readSystemPreference,
        })
    }
    return controllerInstance
}

export function useTheme(): {
    theme: Theme
    setTheme: (t: Theme) => void
    cycleTheme: () => void
} {
    const ctrl = getController()
    const [theme, setThemeState] = useState(() => ctrl.getTheme())

    useEffect(() => {
        const unsub = ctrl.subscribe((t) => {
            setThemeState(t)
            if (typeof document !== 'undefined') {
                document.documentElement.dataset.theme = ctrl.getDataTheme()
            }
        })
        // Apply on mount too
        if (typeof document !== 'undefined') {
            document.documentElement.dataset.theme = ctrl.getDataTheme()
        }
        return unsub
    }, [ctrl])

    return {
        theme,
        setTheme: (t: Theme) => ctrl.setTheme(t),
        cycleTheme: () => ctrl.cycleTheme(),
    }
}

export type { Theme }
