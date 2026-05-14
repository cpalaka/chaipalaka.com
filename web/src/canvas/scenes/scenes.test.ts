import { describe, test, expect } from 'vitest'
import { SCENE_REGISTRY } from './registry'
import { defaultsOf, type SceneParamSchema } from './paramSchema'

const HEX6 = /^#[0-9a-fA-F]{6}$/

describe('canvas scenes — registry entry shape', () => {
    for (const entry of SCENE_REGISTRY) {
        describe(entry.scene.id, () => {
            test('accentColor is a 6-digit hex string', () => {
                expect(entry.scene.accentColor).toMatch(HEX6)
            })

            test('fallbackColors is a tuple of two 6-digit hex strings', () => {
                expect(entry.scene.fallbackColors).toHaveLength(2)
                expect(entry.scene.fallbackColors[0]).toMatch(HEX6)
                expect(entry.scene.fallbackColors[1]).toMatch(HEX6)
            })

            test('fallbackPng is a non-empty string', () => {
                expect(typeof entry.scene.fallbackPng).toBe('string')
                expect(entry.scene.fallbackPng.length).toBeGreaterThan(0)
            })

            test('loader resolves to a module exposing Scene', async () => {
                const mod = await entry.loader()
                expect(typeof mod.Scene).toBe('function')
            })

            if (entry.tunable) {
                test('tunable: loader resolves to a module exposing SCHEMA and DEFAULT_PARAMS', async () => {
                    const mod = (await entry.loader()) as unknown as {
                        SCHEMA: SceneParamSchema
                        Scene: unknown
                        DEFAULT_PARAMS: Record<string, unknown>
                    }
                    expect(mod.SCHEMA, 'SCHEMA export required').toBeDefined()
                    const derived = defaultsOf(mod.SCHEMA)
                    expect(Object.keys(derived).sort()).toEqual(
                        Object.keys(mod.SCHEMA).sort(),
                    )
                    expect(mod.DEFAULT_PARAMS).toEqual(derived)
                })
            }
        })
    }
})
