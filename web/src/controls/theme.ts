export type Theme = 'dark' | 'light' | 'system'

export const THEME_STORAGE_KEY = 'chaipalaka.theme'

const CYCLE: readonly Theme[] = ['system', 'dark', 'light']

export interface ThemeController {
    getTheme(): Theme
    setTheme(theme: Theme): void
    cycleTheme(): void
    getDataTheme(): string
    subscribe(listener: (theme: Theme) => void): () => void
}

export interface ThemeControllerDeps {
    storage: Map<string, string>
}

function readTheme(storage: Map<string, string>): Theme {
    const stored = storage.get(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
        return stored
    }
    return 'system'
}

export function createThemeController(
    deps: ThemeControllerDeps,
): ThemeController {
    const { storage } = deps
    let current: Theme = readTheme(storage)
    const listeners = new Set<(theme: Theme) => void>()

    return {
        getTheme() {
            return current
        },

        setTheme(theme: Theme) {
            current = theme
            storage.set(THEME_STORAGE_KEY, current)
            for (const l of listeners) l(current)
        },

        cycleTheme() {
            const idx = CYCLE.indexOf(current)
            current = CYCLE[(idx + 1) % CYCLE.length]!
            storage.set(THEME_STORAGE_KEY, current)
            for (const l of listeners) l(current)
        },

        getDataTheme() {
            return current === 'system' ? '' : current
        },

        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
    }
}
