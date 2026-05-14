import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FONT_BODY, FONT_MONO, FONT_CARD_TITLE } from './fonts'

const here = dirname(fileURLToPath(import.meta.url))
const tokensCss = readFileSync(join(here, '..', 'styles', 'tokens.css'), 'utf8')

function firstFamily(varName: string): string {
    const re = new RegExp(`--${varName}:\\s*(?:'([^']+)'|"([^"]+)"|([^,;\\n]+))`)
    const m = tokensCss.match(re)
    if (!m) throw new Error(`tokens.css: --${varName} not found`)
    return (m[1] ?? m[2] ?? m[3] ?? '').trim()
}

describe('fonts', () => {
    test('FONT_BODY is pinned: IBM Plex Sans 400 16px / 1.6', () => {
        expect(FONT_BODY).toEqual({
            family: 'IBM Plex Sans',
            size: 16,
            weight: 400,
            lineHeight: 1.6,
        })
    })

    test('FONT_MONO is pinned: JetBrains Mono Variable 400 14px / 1.6', () => {
        expect(FONT_MONO).toEqual({
            family: 'JetBrains Mono Variable',
            size: 14,
            weight: 400,
            lineHeight: 1.6,
        })
    })

    test('FONT_CARD_TITLE is pinned: IBM Plex Sans 600 36px / 1.15', () => {
        expect(FONT_CARD_TITLE).toEqual({
            family: 'IBM Plex Sans',
            size: 36,
            weight: 600,
            lineHeight: 1.15,
        })
    })

    test('FONT_BODY.family agrees with --font-body in tokens.css', () => {
        const cssFamily = firstFamily('font-body')
        expect(FONT_BODY.family).toBe(cssFamily)
    })

    test('FONT_MONO.family agrees with --font-mono in tokens.css', () => {
        const cssFamily = firstFamily('font-mono')
        expect(FONT_MONO.family).toBe(cssFamily)
    })
})
