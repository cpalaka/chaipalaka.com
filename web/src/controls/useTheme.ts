import { useEffect } from 'react'
import { createThemeController, THEME_STORAGE_KEY } from './theme'
import type { Theme } from './theme'
import { useController } from '../state/useController'
import { persistentMap } from '../state/persistentMap'

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
            storage: persistentMap(THEME_STORAGE_KEY),
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
    const theme = useController(getController)

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.dataset.theme = ctrl.getDataTheme()
        }
    }, [theme, ctrl])

    return {
        theme,
        setTheme: (t: Theme) => ctrl.setTheme(t),
        cycleTheme: () => ctrl.cycleTheme(),
    }
}

export type { Theme }
