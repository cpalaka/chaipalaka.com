import { createSubscribable } from '../state/subscribable'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'chaipalaka.theme'

export interface ThemeController {
    get(): Theme
    getTheme(): Theme
    setTheme(theme: Theme): void
    cycleTheme(): void
    getDataTheme(): string
    subscribe(listener: (theme: Theme) => void): () => void
}

export interface ThemeControllerDeps {
    storage: Map<string, string>
    getSystemPreference: () => Theme
}

function readTheme(
    storage: Map<string, string>,
    getSystemPreference: () => Theme,
): Theme {
    const stored = storage.get(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
        return stored
    }
    // Migrate stored 'system' or any unrecognised value to the resolved OS preference
    const resolved = getSystemPreference()
    storage.set(THEME_STORAGE_KEY, resolved)
    return resolved
}

export function createThemeController(
    deps: ThemeControllerDeps,
): ThemeController {
    const { storage, getSystemPreference } = deps
    const state = createSubscribable<Theme>(readTheme(storage, getSystemPreference))

    function commit(next: Theme) {
        storage.set(THEME_STORAGE_KEY, next)
        state.set(next)
    }

    return {
        get: state.get,
        getTheme: state.get,
        getDataTheme: state.get,

        setTheme(theme: Theme) {
            commit(theme)
        },

        cycleTheme() {
            commit(state.get() === 'dark' ? 'light' : 'dark')
        },

        subscribe: state.subscribe,
    }
}
