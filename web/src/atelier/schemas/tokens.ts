/**
 * Hand-curated Tokens-axis schema — maps the tunable custom properties of
 * web/src/styles/tokens.css to widgets with curated ranges.
 *
 * Two schemas because tokens.css has two kinds of declaration:
 *
 * - Base tokens (card chrome, typography, spacing) are declared only at
 *   `:root` and apply to both themes. Axis `tokens.base`, written back as
 *   dark/:root edits.
 * - Theme tokens (palette) are declared per theme block. Axes `tokens.dark`
 *   and `tokens.light` share TOKENS_THEME_SCHEMA; schema defaults are the
 *   dark declarations and act only as the stale-data fallback — Baselines
 *   re-derive from getComputedStyle.
 *
 * Excluded from v1 (approved 2026-06-09): --color-accent (BackgroundGallery
 * writes it inline per scene — the binder would fight it), shadows and
 * rgba() tokens (--color-rule, --color-selection — no widget kind fits),
 * font families/weights (string stacks; families are TS-mirrored).
 */

import { defineTuning } from '../../canvas/scenes/paramSchema'

export interface TokenBinding {
    prop: `--${string}`
    /** Serialization unit: numbers render as `${value}${unit}`. */
    unit: 'px' | 'rem' | ''
}

export const TOKENS_BASE_SCHEMA = defineTuning({
    cardChrome: {
        kind: 'group',
        label: 'Card chrome',
        fields: {
            borderWidth: { kind: 'range', default: 4, min: 0, max: 8, step: 0.5, label: 'Border width' },
            radius: { kind: 'range', default: 4, min: 0, max: 24, step: 1, label: 'Radius' },
            padding: { kind: 'range', default: 24, min: 0, max: 48, step: 2, label: 'Padding' },
            gap: { kind: 'range', default: 24, min: 0, max: 48, step: 2, label: 'Gap' },
        },
    },
    typography: {
        kind: 'group',
        label: 'Typography',
        fields: {
            sizeXs: { kind: 'range', default: 0.75, min: 0.5, max: 5, step: 0.0625, label: 'Size xs' },
            sizeSm: { kind: 'range', default: 0.875, min: 0.5, max: 5, step: 0.0625, label: 'Size sm' },
            sizeBase: { kind: 'range', default: 1, min: 0.5, max: 5, step: 0.0625, label: 'Size base' },
            sizeMd: { kind: 'range', default: 1.125, min: 0.5, max: 5, step: 0.0625, label: 'Size md' },
            sizeLg: { kind: 'range', default: 1.375, min: 0.5, max: 5, step: 0.0625, label: 'Size lg' },
            sizeXl: { kind: 'range', default: 1.75, min: 0.5, max: 5, step: 0.0625, label: 'Size xl' },
            size2xl: { kind: 'range', default: 2.25, min: 0.5, max: 5, step: 0.0625, label: 'Size 2xl' },
            size3xl: { kind: 'range', default: 2.875, min: 0.5, max: 5, step: 0.0625, label: 'Size 3xl' },
            size4xl: { kind: 'range', default: 3.5, min: 0.5, max: 5, step: 0.0625, label: 'Size 4xl' },
            lineHeightTight: { kind: 'range', default: 1.15, min: 1, max: 2.2, step: 0.05, label: 'Line height tight' },
            lineHeightSnug: { kind: 'range', default: 1.3, min: 1, max: 2.2, step: 0.05, label: 'Line height snug' },
            lineHeightBase: { kind: 'range', default: 1.6, min: 1, max: 2.2, step: 0.05, label: 'Line height base' },
        },
    },
    spacing: {
        kind: 'group',
        label: 'Spacing',
        fields: {
            space1: { kind: 'range', default: 0.25, min: 0, max: 8, step: 0.125, label: 'Space 1' },
            space2: { kind: 'range', default: 0.5, min: 0, max: 8, step: 0.125, label: 'Space 2' },
            space3: { kind: 'range', default: 0.75, min: 0, max: 8, step: 0.125, label: 'Space 3' },
            space4: { kind: 'range', default: 1, min: 0, max: 8, step: 0.125, label: 'Space 4' },
            space5: { kind: 'range', default: 1.5, min: 0, max: 8, step: 0.125, label: 'Space 5' },
            space6: { kind: 'range', default: 2, min: 0, max: 8, step: 0.125, label: 'Space 6' },
            space7: { kind: 'range', default: 3, min: 0, max: 8, step: 0.125, label: 'Space 7' },
            space8: { kind: 'range', default: 4, min: 0, max: 8, step: 0.125, label: 'Space 8' },
        },
    },
})

export const TOKENS_THEME_SCHEMA = defineTuning({
    palette: {
        kind: 'group',
        label: 'Palette',
        fields: {
            bg: { kind: 'color', default: '#0a0a0a', label: 'Background' },
            bgRaised: { kind: 'color', default: '#111111', label: 'Background raised' },
            fg: { kind: 'color', default: '#f8f8f8', label: 'Foreground' },
            fgMuted: { kind: 'color', default: '#999999', label: 'Foreground muted' },
            fgFaint: { kind: 'color', default: '#555555', label: 'Foreground faint' },
        },
    },
})

export const BASE_TOKEN_BINDINGS: Record<string, TokenBinding> = {
    'cardChrome.borderWidth': { prop: '--card-border-width', unit: 'px' },
    'cardChrome.radius': { prop: '--card-radius', unit: 'px' },
    'cardChrome.padding': { prop: '--card-padding', unit: 'px' },
    'cardChrome.gap': { prop: '--card-gap', unit: 'px' },
    'typography.sizeXs': { prop: '--font-size-xs', unit: 'rem' },
    'typography.sizeSm': { prop: '--font-size-sm', unit: 'rem' },
    'typography.sizeBase': { prop: '--font-size-base', unit: 'rem' },
    'typography.sizeMd': { prop: '--font-size-md', unit: 'rem' },
    'typography.sizeLg': { prop: '--font-size-lg', unit: 'rem' },
    'typography.sizeXl': { prop: '--font-size-xl', unit: 'rem' },
    'typography.size2xl': { prop: '--font-size-2xl', unit: 'rem' },
    'typography.size3xl': { prop: '--font-size-3xl', unit: 'rem' },
    'typography.size4xl': { prop: '--font-size-4xl', unit: 'rem' },
    'typography.lineHeightTight': { prop: '--line-height-tight', unit: '' },
    'typography.lineHeightSnug': { prop: '--line-height-snug', unit: '' },
    'typography.lineHeightBase': { prop: '--line-height-base', unit: '' },
    'spacing.space1': { prop: '--space-1', unit: 'rem' },
    'spacing.space2': { prop: '--space-2', unit: 'rem' },
    'spacing.space3': { prop: '--space-3', unit: 'rem' },
    'spacing.space4': { prop: '--space-4', unit: 'rem' },
    'spacing.space5': { prop: '--space-5', unit: 'rem' },
    'spacing.space6': { prop: '--space-6', unit: 'rem' },
    'spacing.space7': { prop: '--space-7', unit: 'rem' },
    'spacing.space8': { prop: '--space-8', unit: 'rem' },
}

export const THEME_TOKEN_BINDINGS: Record<string, TokenBinding> = {
    'palette.bg': { prop: '--color-bg', unit: '' },
    'palette.bgRaised': { prop: '--color-bg-raised', unit: '' },
    'palette.fg': { prop: '--color-fg', unit: '' },
    'palette.fgMuted': { prop: '--color-fg-muted', unit: '' },
    'palette.fgFaint': { prop: '--color-fg-faint', unit: '' },
}

/** AtelierStore axis keys for the Tokens axis (3 axes — ratified deviation
 * from the spec's `tokens: {dark, light}`; see CONTEXT.md "Working set"). */
export const TOKENS_BASE_AXIS = 'tokens.base'
export const tokensThemeAxis = (theme: 'dark' | 'light') => `tokens.${theme}`
