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
            colorMode: 'light',
            frameEdge: 'top',
        }
        expect(decode(encode(custom).toString())).toEqual(custom)
    })

    it('ignores unknown params and falls back to defaults', () => {
        const result = decode('?flavor=unknown&bw=999&bogus=xyz')
        expect(result.colorMode).toBe(DEFAULT_CONFIG.colorMode)
        expect(result.frameEdge).toBe(DEFAULT_CONFIG.frameEdge)
    })

    it('partial override: only changed keys differ from default', () => {
        const result = decode('cm=light')
        expect(result.colorMode).toBe('light')
        expect(result.frameEdge).toBe(DEFAULT_CONFIG.frameEdge)
    })
})
