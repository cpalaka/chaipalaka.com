import { describe, it, expect } from 'vitest'
import { encode, decode } from './snapshot'
import { DEFAULT_CONFIG, type SandboxConfig } from './state'

describe('snapshot encode/decode round-trip', () => {
    it('default config encodes to empty params', () => {
        const p = encode(DEFAULT_CONFIG)
        expect([...p.entries()]).toHaveLength(0)
    })

    it('default config survives decode(empty)', () => {
        expect(decode('')).toEqual(DEFAULT_CONFIG)
    })

    it('round-trips a fully-custom config', () => {
        const custom: SandboxConfig = {
            flavor: 'neo',
            borderWidth: 6,
            borderStyle: 'dashed',
            radius: 4,
            shadow: 'soft',
            font: 'ibm-plex-mono',
            fontSize: 20,
            lineHeight: 1.8,
            letterSpacing: 0.05,
            colorMode: 'light',
            padding: 12,
            flourish: 'noise-field',
            resizeMode: '4-corner',
            springDuringResize: true,
            snapToGrid: true,
            frameEdge: 'left',
            animMechanism: 'vt',
            scrollIndicator: 'progress-line',
            viewportSim: 'mobile',
        }
        expect(decode(encode(custom).toString())).toEqual(custom)
    })

    it('ignores unknown params and falls back to defaults', () => {
        const result = decode('?flavor=unknown&bw=999&bogus=xyz')
        expect(result.flavor).toBe(DEFAULT_CONFIG.flavor)
        expect(result.borderWidth).toBe(DEFAULT_CONFIG.borderWidth)
    })

    it('partial override: only changed keys differ from default', () => {
        const result = decode('fl=swiss&cm=light')
        expect(result.flavor).toBe('swiss')
        expect(result.colorMode).toBe('light')
        expect(result.borderWidth).toBe(DEFAULT_CONFIG.borderWidth)
        expect(result.font).toBe(DEFAULT_CONFIG.font)
    })
})
