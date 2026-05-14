import { describe, test, expect } from 'vitest'
import type { BackgroundScene } from '../types'
import { getLazyScene } from '../BackgroundCanvas'
import manifest from './manifest.json'
import { TUNABLE_SCENE_IDS, tunableSceneLoaders } from './tunable'
import { defaultsOf, type SceneParamSchema } from './paramSchema'

const HEX6 = /^#[0-9a-fA-F]{6}$/

const SCENES: ReadonlyArray<{ id: string; loader: () => Promise<unknown> }> = [
    { id: 'particles-flow', loader: () => import('./particles-flow') },
    { id: 'particles-boids', loader: () => import('./particles-boids') },
    { id: 'particles-cursor', loader: () => import('./particles-cursor') },
    { id: 'particles-starfield', loader: () => import('./particles-starfield') },
    { id: 'geometric-voronoi', loader: () => import('./geometric-voronoi') },
    { id: 'geometric-subdivision', loader: () => import('./geometric-subdivision') },
    { id: 'geometric-reaction-diffusion', loader: () => import('./geometric-reaction-diffusion') },
    { id: 'flow-shader', loader: () => import('./flow-shader') },
    { id: 'audio-reactive', loader: () => import('./audio-reactive') },
]

function findSceneExport(
    mod: Record<string, unknown>,
    expectedId: string,
): BackgroundScene | undefined {
    return Object.values(mod).find(
        (v): v is BackgroundScene =>
            typeof v === 'object' &&
            v !== null &&
            'id' in v &&
            'Component' in v &&
            (v as { id: unknown }).id === expectedId,
    )
}

describe('canvas scenes — module shape', () => {
    for (const { id, loader } of SCENES) {
        describe(id, () => {
            test('imports without throwing and exports a BackgroundScene with the expected id', async () => {
                const mod = (await loader()) as Record<string, unknown>
                const entry = findSceneExport(mod, id)
                expect(entry, `expected an exported BackgroundScene with id "${id}"`).toBeDefined()
                expect(entry!.id).toBe(id)
            })

            test('Component is a function (not invoked)', async () => {
                const mod = (await loader()) as Record<string, unknown>
                const entry = findSceneExport(mod, id)!
                expect(typeof entry.Component).toBe('function')
            })

            test('fallbackPng is a non-empty string', async () => {
                const mod = (await loader()) as Record<string, unknown>
                const entry = findSceneExport(mod, id)!
                expect(typeof entry.fallbackPng).toBe('string')
                expect(entry.fallbackPng.length).toBeGreaterThan(0)
            })

            test('accentColor is a 6-digit hex string', async () => {
                const mod = (await loader()) as Record<string, unknown>
                const entry = findSceneExport(mod, id)!
                expect(entry.accentColor).toMatch(HEX6)
            })

            test('fallbackColors is a tuple of two 6-digit hex strings', async () => {
                const mod = (await loader()) as Record<string, unknown>
                const entry = findSceneExport(mod, id)!
                expect(Array.isArray(entry.fallbackColors)).toBe(true)
                expect(entry.fallbackColors).toHaveLength(2)
                expect(entry.fallbackColors[0]).toMatch(HEX6)
                expect(entry.fallbackColors[1]).toMatch(HEX6)
            })
        })
    }
})

describe('tunable scenes — SCHEMA shape', () => {
    for (const id of TUNABLE_SCENE_IDS) {
        describe(id, () => {
            test('module exports SCHEMA, Scene, and DEFAULT_PARAMS derived from SCHEMA', async () => {
                const mod = (await tunableSceneLoaders[id]!()) as unknown as {
                    SCHEMA: SceneParamSchema
                    Scene: unknown
                    DEFAULT_PARAMS: Record<string, unknown>
                }
                expect(mod.SCHEMA, 'SCHEMA export required').toBeDefined()
                expect(typeof mod.Scene, 'Scene export must be a function').toBe('function')
                const derived = defaultsOf(mod.SCHEMA)
                expect(Object.keys(derived).sort()).toEqual(Object.keys(mod.SCHEMA).sort())
                expect(mod.DEFAULT_PARAMS).toEqual(derived)
            })
        })
    }
})

describe('manifest.json', () => {
    const expectedIds = SCENES.map((s) => s.id).sort()

    test('contains exactly 9 entries', () => {
        expect(manifest).toHaveLength(9)
    })

    test('every manifest id matches a known scene (no extras, no missing)', () => {
        const manifestIds = manifest.map((m) => m.id).sort()
        expect(manifestIds).toEqual(expectedIds)
    })

    test('every manifest entry has a corresponding loader in BackgroundCanvas sceneLoaders', () => {
        // getLazyScene throws synchronously if no loader exists for the id.
        for (const entry of manifest) {
            const scene: BackgroundScene = {
                id: entry.id,
                accentColor: entry.accentColor,
                fallbackColors: entry.fallbackColors as unknown as readonly [string, string],
                fallbackPng: entry.fallbackPng,
                Component: () => null,
            }
            expect(() => getLazyScene(scene)).not.toThrow()
        }
    })
})
