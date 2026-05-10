import { describe, test, expect } from 'vitest'
import { createThemeController, THEME_STORAGE_KEY } from './theme'

type Storage = Map<string, string>

function fakeStorage(init: Record<string, string> = {}): Storage {
    return new Map(Object.entries(init))
}

describe('theme controller initialisation', () => {
    test('defaults to "system" when storage is empty', () => {
        const ctrl = createThemeController({ storage: fakeStorage() })
        expect(ctrl.getTheme()).toBe('system')
    })

    test('reads persisted "dark" from storage', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }),
        })
        expect(ctrl.getTheme()).toBe('dark')
    })

    test('reads persisted "light" from storage', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'light' }),
        })
        expect(ctrl.getTheme()).toBe('light')
    })

    test('falls back to "system" for an unrecognised storage value', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'neon' }),
        })
        expect(ctrl.getTheme()).toBe('system')
    })
})

describe('theme controller cycle', () => {
    test('cycles system → dark → light → system', () => {
        const ctrl = createThemeController({ storage: fakeStorage() })
        expect(ctrl.getTheme()).toBe('system')
        ctrl.cycleTheme()
        expect(ctrl.getTheme()).toBe('dark')
        ctrl.cycleTheme()
        expect(ctrl.getTheme()).toBe('light')
        ctrl.cycleTheme()
        expect(ctrl.getTheme()).toBe('system')
    })

    test('cycleTheme persists the new value to storage', () => {
        const storage = fakeStorage()
        const ctrl = createThemeController({ storage })
        ctrl.cycleTheme()
        expect(storage.get(THEME_STORAGE_KEY)).toBe('dark')
        ctrl.cycleTheme()
        expect(storage.get(THEME_STORAGE_KEY)).toBe('light')
        ctrl.cycleTheme()
        expect(storage.get(THEME_STORAGE_KEY)).toBe('system')
    })
})

describe('theme controller getDataTheme', () => {
    test('returns empty string for "system"', () => {
        const ctrl = createThemeController({ storage: fakeStorage() })
        expect(ctrl.getDataTheme()).toBe('')
    })

    test('returns "dark" for dark', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }),
        })
        expect(ctrl.getDataTheme()).toBe('dark')
    })

    test('returns "light" for light', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'light' }),
        })
        expect(ctrl.getDataTheme()).toBe('light')
    })
})

describe('theme controller subscribe', () => {
    test('listener fires on each cycleTheme call with the new theme', () => {
        const ctrl = createThemeController({ storage: fakeStorage() })
        const seen: string[] = []
        ctrl.subscribe((t) => seen.push(t))
        ctrl.cycleTheme()
        ctrl.cycleTheme()
        expect(seen).toEqual(['dark', 'light'])
    })

    test('unsubscribe stops future notifications', () => {
        const ctrl = createThemeController({ storage: fakeStorage() })
        const seen: string[] = []
        const unsub = ctrl.subscribe((t) => seen.push(t))
        ctrl.cycleTheme()
        unsub()
        ctrl.cycleTheme()
        expect(seen).toEqual(['dark'])
    })
})
