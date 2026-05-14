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
    let current: Theme = readTheme(storage, getSystemPreference)
    const listeners = new Set<(theme: Theme) => void>()

    return {
        get: () => current,

        getTheme() {
            return current
        },

        setTheme(theme: Theme) {
            current = theme
            storage.set(THEME_STORAGE_KEY, current)
            for (const l of listeners) l(current)
        },

        cycleTheme() {
            current = current === 'dark' ? 'light' : 'dark'
            storage.set(THEME_STORAGE_KEY, current)
            for (const l of listeners) l(current)
        },

        getDataTheme() {
            return current
        },

        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
    }
}
