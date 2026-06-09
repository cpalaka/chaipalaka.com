/**
 * Tokens live binding — the glue between the AtelierStore and the document.
 *
 * Owns the three Tokens axes (tokens.base, tokens.dark, tokens.light):
 * registers them, reads Baselines from computed styles, and mirrors dirty
 * working values onto documentElement inline properties (dirty-only — see
 * tokensBinder.ts). The active theme's palette axis applies alongside the
 * always-applied base axis; theme switches re-derive the incoming theme's
 * Baseline with inline overrides cleared so the stylesheet shows through.
 *
 * DOM access is injected so the whole lifecycle tests without a browser;
 * the React layer wires documentElement + ThemeController in.
 */

import type { AtelierStore } from './atelierStore'
import type { Theme } from '../controls/theme'
import { diffTokenOps, readTokenBaseline } from './tokensBinder'
import {
    BASE_TOKEN_BINDINGS,
    THEME_TOKEN_BINDINGS,
    TOKENS_BASE_SCHEMA,
    TOKENS_THEME_SCHEMA,
    TOKENS_BASE_AXIS,
    tokensThemeAxis,
} from './schemas/tokens'

export interface TokensBindingDeps {
    store: AtelierStore
    theme: {
        get(): Theme
        subscribe(listener: (next: Theme) => void): () => void
    }
    style: {
        setProperty(prop: string, value: string): void
        removeProperty(prop: string): void
    }
    /** Computed value of one custom property, e.g. via getComputedStyle. */
    readToken(prop: string): string
}

export interface TokensBinding {
    /**
     * After a successful write-back the regenerated source equals the working
     * values, so the working values ARE the new Baseline. Adopting them
     * optimistically (instead of re-reading computed styles) avoids racing
     * Vite's async CSS HMR; every dirty flag and inline override drops.
     */
    writeBackReconcile(): void
    dispose(): void
}

const ALL_PROPS = [
    ...Object.values(BASE_TOKEN_BINDINGS),
    ...Object.values(THEME_TOKEN_BINDINGS),
].map((b) => b.prop)

export function createTokensBinding(deps: TokensBindingDeps): TokensBinding {
    const { store, theme, style, readToken } = deps
    let applying = false

    store.registerAxis(TOKENS_BASE_AXIS, TOKENS_BASE_SCHEMA)
    store.registerAxis(tokensThemeAxis('dark'), TOKENS_THEME_SCHEMA)
    store.registerAxis(tokensThemeAxis('light'), TOKENS_THEME_SCHEMA)

    function clearInline() {
        for (const prop of ALL_PROPS) style.removeProperty(prop)
    }

    /** Mirror dirty fields of the base + active-theme axes onto inline style. */
    function apply() {
        // reconcileBaseline inside syncTheme commits store changes; the store
        // subscription below re-enters here mid-sync, before the incoming
        // theme's baseline exists. Guarded, and apply() runs once at the end.
        if (applying) return
        const { axes, baselines } = store.get()
        const axisOps = [
            { axis: TOKENS_BASE_AXIS, bindings: BASE_TOKEN_BINDINGS },
            { axis: tokensThemeAxis(theme.get()), bindings: THEME_TOKEN_BINDINGS },
        ]
        for (const { axis, bindings } of axisOps) {
            const working = axes[axis]
            const baseline = baselines[axis]
            if (!working || !baseline) continue
            const ops = diffTokenOps(working, baseline, bindings)
            for (const prop of ops.remove) style.removeProperty(prop)
            for (const { prop, value } of ops.set) style.setProperty(prop, value)
        }
    }

    /**
     * Baselines must be read with no inline overrides in the way — a dirty
     * field's override would otherwise be read back as its own Baseline.
     */
    function syncTheme(next: Theme) {
        applying = true
        try {
            clearInline()
            store.reconcileBaseline(
                TOKENS_BASE_AXIS,
                readTokenBaseline(TOKENS_BASE_SCHEMA, BASE_TOKEN_BINDINGS, readToken),
            )
            store.reconcileBaseline(
                tokensThemeAxis(next),
                readTokenBaseline(TOKENS_THEME_SCHEMA, THEME_TOKEN_BINDINGS, readToken),
            )
        } finally {
            applying = false
        }
        apply()
    }

    const unsubscribeStore = store.subscribe(apply)
    const unsubscribeTheme = theme.subscribe(syncTheme)
    syncTheme(theme.get())

    return {
        writeBackReconcile() {
            const { axes } = store.get()
            for (const axis of [
                TOKENS_BASE_AXIS,
                tokensThemeAxis('dark'),
                tokensThemeAxis('light'),
            ]) {
                const working = axes[axis]
                if (working) store.reconcileBaseline(axis, working)
            }
        },
        dispose() {
            unsubscribeStore()
            unsubscribeTheme()
            clearInline()
        },
    }
}
