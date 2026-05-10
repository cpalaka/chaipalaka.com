import { describe, test, expect } from 'vitest'
import { createThemeController, THEME_STORAGE_KEY } from './theme'
import type { Theme } from './theme'

type Storage = Map<string, string>

function fakeStorage(init: Record<string, string> = {}): Storage {
    return new Map(Object.entries(init))
}

function makePreference(pref: Theme): () => Theme {
    return () => pref
}

describe('theme controller initialisation', () => {
    test('defaults to OS dark preference when storage is empty', () => {
        const ctrl = createThemeController({
            storage: fakeStorage(),
            getSystemPreference: makePreference('dark'),
        })
        expect(ctrl.getTheme()).toBe('dark')
    })

    test('defaults to OS light preference when storage is empty', () => {
        const ctrl = createThemeController({
            storage: fakeStorage(),
            getSystemPreference: makePreference('light'),
        })
        expect(ctrl.getTheme()).toBe('light')
    })

    test('persists OS preference to storage on first read', () => {
        const storage = fakeStorage()
        createThemeController({
            storage,
            getSystemPreference: makePreference('dark'),
        })
        expect(storage.get(THEME_STORAGE_KEY)).toBe('dark')
    })

    test('reads persisted "dark" from storage', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }),
            getSystemPreference: makePreference('light'),
        })
        expect(ctrl.getTheme()).toBe('dark')
    })

    test('reads persisted "light" from storage', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'light' }),
            getSystemPreference: makePreference('dark'),
        })
        expect(ctrl.getTheme()).toBe('light')
    })

    test('migrates stored "system" to OS preference and re-persists', () => {
        const storage = fakeStorage({ [THEME_STORAGE_KEY]: 'system' })
        const ctrl = createThemeController({
            storage,
            getSystemPreference: makePreference('light'),
        })
        expect(ctrl.getTheme()).toBe('light')
        expect(storage.get(THEME_STORAGE_KEY)).toBe('light')
    })

    test('falls back to OS preference for unrecognised stored value', () => {
        const storage = fakeStorage({ [THEME_STORAGE_KEY]: 'neon' })
        const ctrl = createThemeController({
            storage,
            getSystemPreference: makePreference('dark'),
        })
        expect(ctrl.getTheme()).toBe('dark')
        expect(storage.get(THEME_STORAGE_KEY)).toBe('dark')
    })
})

describe('theme controller cycle', () => {
    test('cycles dark → light → dark', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }),
            getSystemPreference: makePreference('dark'),
        })
        expect(ctrl.getTheme()).toBe('dark')
        ctrl.cycleTheme()
        expect(ctrl.getTheme()).toBe('light')
        ctrl.cycleTheme()
        expect(ctrl.getTheme()).toBe('dark')
    })

    test('cycleTheme persists the new value to storage', () => {
        const storage = fakeStorage({ [THEME_STORAGE_KEY]: 'dark' })
        const ctrl = createThemeController({
            storage,
            getSystemPreference: makePreference('dark'),
        })
        ctrl.cycleTheme()
        expect(storage.get(THEME_STORAGE_KEY)).toBe('light')
        ctrl.cycleTheme()
        expect(storage.get(THEME_STORAGE_KEY)).toBe('dark')
    })
})

describe('theme controller getDataTheme', () => {
    test('returns "dark" for dark', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }),
            getSystemPreference: makePreference('dark'),
        })
        expect(ctrl.getDataTheme()).toBe('dark')
    })

    test('returns "light" for light', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'light' }),
            getSystemPreference: makePreference('dark'),
        })
        expect(ctrl.getDataTheme()).toBe('light')
    })
})

describe('theme controller subscribe', () => {
    test('listener fires on each cycleTheme call with the new theme', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }),
            getSystemPreference: makePreference('dark'),
        })
        const seen: string[] = []
        ctrl.subscribe((t) => seen.push(t))
        ctrl.cycleTheme()
        ctrl.cycleTheme()
        expect(seen).toEqual(['light', 'dark'])
    })

    test('unsubscribe stops future notifications', () => {
        const ctrl = createThemeController({
            storage: fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }),
            getSystemPreference: makePreference('dark'),
        })
        const seen: string[] = []
        const unsub = ctrl.subscribe((t) => seen.push(t))
        ctrl.cycleTheme()
        unsub()
        ctrl.cycleTheme()
        expect(seen).toEqual(['light'])
    })
})
