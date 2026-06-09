import { describe, test, expect, beforeEach } from 'vitest'
import { createSubscribable } from '../state/subscribable'
import { createAtelierStore } from './atelierStore'
import type { AtelierStore } from './atelierStore'
import { createTokensBinding } from './tokensBinding'
import type { TokensBinding } from './tokensBinding'
import { TOKENS_BASE_AXIS, tokensThemeAxis } from './schemas/tokens'
import type { Theme } from '../controls/theme'

/** Stylesheet stand-in: dark/light token sources + an inline override map. */
function makeDom(initialTheme: Theme) {
    const themeState = createSubscribable<Theme>(initialTheme)
    const sources: Record<Theme, Record<string, string>> = {
        dark: {
            '--card-border-width': '4px',
            '--color-bg': '#0a0a0a',
        },
        light: {
            '--card-border-width': '4px',
            '--color-bg': '#f8f8f8',
        },
    }
    const inline = new Map<string, string>()
    return {
        inline,
        theme: {
            get: themeState.get,
            set: themeState.set,
            subscribe: themeState.subscribe,
        },
        style: {
            setProperty: (prop: string, value: string) => void inline.set(prop, value),
            removeProperty: (prop: string) => void inline.delete(prop),
        },
        // Computed-style semantics: inline wins over the stylesheet.
        readToken: (prop: string) =>
            inline.get(prop) ?? sources[themeState.get()][prop] ?? '',
    }
}

describe('createTokensBinding', () => {
    let dom: ReturnType<typeof makeDom>
    let store: AtelierStore
    let binding: TokensBinding

    beforeEach(() => {
        dom = makeDom('dark')
        store = createAtelierStore({ storage: new Map() })
        binding = createTokensBinding({
            store,
            theme: dom.theme,
            style: dom.style,
            readToken: dom.readToken,
        })
    })

    test('creation registers the three axes and reconciles baselines from the stylesheet', () => {
        const { baselines } = store.get()
        expect(baselines[TOKENS_BASE_AXIS]).toBeDefined()
        expect(baselines[tokensThemeAxis('dark')]).toBeDefined()
        expect(
            (baselines[TOKENS_BASE_AXIS] as { cardChrome: { borderWidth: number } }).cardChrome
                .borderWidth,
        ).toBe(4)
        expect(
            (baselines[tokensThemeAxis('dark')] as { palette: { bg: string } }).palette.bg,
        ).toBe('#0a0a0a')
        expect(dom.inline.size).toBe(0)
    })

    test('an edit applies only the dirty field inline; reset removes the inline property', () => {
        const working = structuredClone(store.get().axes[TOKENS_BASE_AXIS]!) as {
            cardChrome: { borderWidth: number }
        }
        working.cardChrome.borderWidth = 6
        store.setValues(TOKENS_BASE_AXIS, working)

        expect(dom.inline.get('--card-border-width')).toBe('6px')
        expect(dom.inline.size).toBe(1)

        store.resetField(TOKENS_BASE_AXIS, 'cardChrome.borderWidth')
        expect(dom.inline.has('--card-border-width')).toBe(false)
        expect(dom.inline.size).toBe(0)
    })

    test('theme switch clears the old palette override, derives the incoming baseline from the stylesheet, and keeps base dirt applied', () => {
        // dirty dark palette + dirty base field
        const dark = structuredClone(store.get().axes[tokensThemeAxis('dark')]!) as {
            palette: { bg: string }
        }
        dark.palette.bg = '#222222'
        store.setValues(tokensThemeAxis('dark'), dark)
        const base = structuredClone(store.get().axes[TOKENS_BASE_AXIS]!) as {
            cardChrome: { borderWidth: number }
        }
        base.cardChrome.borderWidth = 6
        store.setValues(TOKENS_BASE_AXIS, base)
        expect(dom.inline.get('--color-bg')).toBe('#222222')

        dom.theme.set('light')

        // dark palette dirt no longer inline; light baseline came from the
        // light stylesheet source, not from the dark override
        expect(dom.inline.has('--color-bg')).toBe(false)
        expect(
            (store.get().baselines[tokensThemeAxis('light')] as { palette: { bg: string } })
                .palette.bg,
        ).toBe('#f8f8f8')
        // theme-independent base dirt still applied
        expect(dom.inline.get('--card-border-width')).toBe('6px')

        // editing in light mode applies inline and leaves the dark axis alone
        const light = structuredClone(store.get().axes[tokensThemeAxis('light')]!) as {
            palette: { bg: string }
        }
        light.palette.bg = '#eeeeee'
        store.setValues(tokensThemeAxis('light'), light)
        expect(dom.inline.get('--color-bg')).toBe('#eeeeee')
        expect(
            (store.get().axes[tokensThemeAxis('dark')] as { palette: { bg: string } }).palette.bg,
        ).toBe('#222222')
    })

    test('writeBackReconcile adopts working values as the new Baseline and drops every inline override', () => {
        const base = structuredClone(store.get().axes[TOKENS_BASE_AXIS]!) as {
            cardChrome: { borderWidth: number }
        }
        base.cardChrome.borderWidth = 6
        store.setValues(TOKENS_BASE_AXIS, base)
        expect(dom.inline.size).toBe(1)

        binding.writeBackReconcile()

        expect(dom.inline.size).toBe(0)
        expect(store.dirtyPaths(TOKENS_BASE_AXIS)).toEqual([])
        expect(
            (store.get().axes[TOKENS_BASE_AXIS] as { cardChrome: { borderWidth: number } })
                .cardChrome.borderWidth,
        ).toBe(6)
    })

    test('dispose stops applying and clears inline overrides', () => {
        const working = structuredClone(store.get().axes[TOKENS_BASE_AXIS]!) as {
            cardChrome: { borderWidth: number }
        }
        working.cardChrome.borderWidth = 6
        store.setValues(TOKENS_BASE_AXIS, working)
        expect(dom.inline.size).toBe(1)

        binding.dispose()
        expect(dom.inline.size).toBe(0)
    })
})
