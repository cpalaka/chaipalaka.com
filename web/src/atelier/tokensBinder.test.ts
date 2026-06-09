import { describe, test, expect } from 'vitest'
import { defineTuning } from '../canvas/scenes/paramSchema'
import { buildTokenEdits, diffTokenOps, readTokenBaseline } from './tokensBinder'
import type { TokenBinding } from './schemas/tokens'

const SCHEMA = defineTuning({
    chrome: {
        kind: 'group',
        label: 'Chrome',
        fields: {
            borderW: { kind: 'range', default: 4, min: 0, max: 8, step: 0.5, label: 'Border width' },
            sizeBase: { kind: 'range', default: 1, min: 0.5, max: 5, step: 0.0625, label: 'Size base' },
            lineHeight: { kind: 'range', default: 1.6, min: 1, max: 2.2, step: 0.05, label: 'Line height' },
        },
    },
    bg: { kind: 'color', default: '#0a0a0a', label: 'Background' },
})

const BINDINGS: Record<string, TokenBinding> = {
    'chrome.borderW': { prop: '--card-border-width', unit: 'px' },
    'chrome.sizeBase': { prop: '--font-size-base', unit: 'rem' },
    'chrome.lineHeight': { prop: '--line-height-base', unit: '' },
    'bg': { prop: '--color-bg', unit: '' },
}

describe('readTokenBaseline', () => {
    test('parses computed declarations into typed values per field kind', () => {
        const computed: Record<string, string> = {
            '--card-border-width': ' 6px',
            '--font-size-base': '1.125rem',
            '--line-height-base': '1.3',
            '--color-bg': ' #112233',
        }
        const baseline = readTokenBaseline(SCHEMA, BINDINGS, (p) => computed[p] ?? '')
        expect(baseline).toEqual({
            chrome: { borderW: 6, sizeBase: 1.125, lineHeight: 1.3 },
            bg: '#112233',
        })
    })

    test('falls back to schema defaults when a token is missing or unparsable', () => {
        const baseline = readTokenBaseline(SCHEMA, BINDINGS, () => '')
        expect(baseline).toEqual({
            chrome: { borderW: 4, sizeBase: 1, lineHeight: 1.6 },
            bg: '#0a0a0a',
        })
    })
})

describe('diffTokenOps', () => {
    test('dirty fields become set ops with unit serialization; clean fields become removes', () => {
        const baseline = { chrome: { borderW: 4, sizeBase: 1, lineHeight: 1.6 }, bg: '#0a0a0a' }
        const working = { chrome: { borderW: 6, sizeBase: 1, lineHeight: 1.6 }, bg: '#112233' }
        const ops = diffTokenOps(working, baseline, BINDINGS)
        expect(ops.set).toEqual([
            { prop: '--card-border-width', value: '6px' },
            { prop: '--color-bg', value: '#112233' },
        ])
        expect(ops.remove.sort()).toEqual(['--font-size-base', '--line-height-base'])
    })

    test('all-clean working values remove every bound property', () => {
        const baseline = { chrome: { borderW: 4, sizeBase: 1, lineHeight: 1.6 }, bg: '#0a0a0a' }
        const ops = diffTokenOps(baseline, baseline, BINDINGS)
        expect(ops.set).toEqual([])
        expect(ops.remove.length).toBe(4)
    })
})

describe('buildTokenEdits', () => {
    test('base + dark dirty fields land in dark edits; light dirty fields in light edits', () => {
        const cleanBase = { chrome: { borderW: 4, sizeBase: 1, lineHeight: 1.6 }, bg: '#0a0a0a' }
        const darkBaseline = { bg: '#0a0a0a' }
        const lightBaseline = { bg: '#f8f8f8' }
        const edits = buildTokenEdits({
            base: {
                working: { ...cleanBase, chrome: { ...cleanBase.chrome, borderW: 6 } },
                baseline: cleanBase,
                bindings: BINDINGS,
            },
            dark: { working: darkBaseline, baseline: darkBaseline, bindings: BINDINGS },
            light: { working: { bg: '#eeeeee' }, baseline: lightBaseline, bindings: BINDINGS },
        })
        expect(edits).toEqual({
            dark: { '--card-border-width': '6px' },
            light: { '--color-bg': '#eeeeee' },
        })
    })
})
