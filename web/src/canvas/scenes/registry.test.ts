import { describe, test, expect } from 'vitest'
import {
    SCENE_REGISTRY,
    BACKGROUND_SCENES,
    TUNABLE_SCENE_IDS,
    getSceneEntry,
    type SceneEntry,
    type SceneId,
} from './registry'
import { defaultsOf, type SceneParamSchema } from './paramSchema'

const EXPECTED_IDS: readonly SceneId[] = [
    'flow-shader',
    'particles-starfield',
    'particles-cursor',
    'particles-flow',
    'particles-boids',
    'geometric-reaction-diffusion',
    'geometric-voronoi',
    'geometric-subdivision',
    'audio-reactive',
]

const EXPECTED_TUNABLE_IDS: readonly SceneId[] = [
    'particles-starfield',
    'particles-cursor',
    'particles-flow',
    'particles-boids',
    'geometric-reaction-diffusion',
    'geometric-voronoi',
    'geometric-subdivision',
]

describe('SCENE_REGISTRY — structure', () => {
    test('contains exactly 9 entries', () => {
        expect(SCENE_REGISTRY).toHaveLength(9)
    })

    test('every scene id is unique', () => {
        const ids = SCENE_REGISTRY.map((e) => e.scene.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    test('contains exactly the expected 9 ids', () => {
        const ids = SCENE_REGISTRY.map((e) => e.scene.id).sort()
        expect(ids).toEqual([...EXPECTED_IDS].sort())
    })
})

describe('BACKGROUND_SCENES — derived list', () => {
    test('length matches the registry', () => {
        expect(BACKGROUND_SCENES).toHaveLength(SCENE_REGISTRY.length)
    })

    test('each entry preserves the registry scene reference', () => {
        for (let i = 0; i < SCENE_REGISTRY.length; i++) {
            expect(BACKGROUND_SCENES[i]).toBe(SCENE_REGISTRY[i]!.scene)
        }
    })
})

describe('TUNABLE_SCENE_IDS — derived list', () => {
    test('matches the 7 expected tunable scenes', () => {
        expect([...TUNABLE_SCENE_IDS].sort()).toEqual(
            [...EXPECTED_TUNABLE_IDS].sort(),
        )
    })
})

describe('getSceneEntry', () => {
    test('resolves every registry id', () => {
        for (const id of EXPECTED_IDS) {
            const entry = getSceneEntry(id)
            expect(entry, `expected entry for id "${id}"`).toBeDefined()
            expect(entry!.scene.id).toBe(id)
        }
    })

    test('returns undefined for an unknown id', () => {
        const fake = 'does-not-exist' as unknown as SceneId
        expect(getSceneEntry(fake)).toBeUndefined()
    })
})

describe('SCENE_REGISTRY — typed loader contract (runtime)', () => {
    test.each(EXPECTED_TUNABLE_IDS)(
        '%s — tunable entry resolves to module with Scene and SCHEMA',
        async (id) => {
            const entry = getSceneEntry(id)!
            expect(entry.tunable).toBe(true)
            if (!entry.tunable) return // type narrow
            const mod = await entry.loader()
            expect(typeof mod.Scene).toBe('function')
            expect(mod.SCHEMA).toBeDefined()
            // SCHEMA's defaults extract is the same shape as DEFAULT_PARAMS
            // exported by tunable modules — sanity check the typing.
            const derived = defaultsOf(mod.SCHEMA satisfies SceneParamSchema)
            expect(Object.keys(derived).length).toBeGreaterThan(0)
        },
    )

    test('flow-shader — static entry resolves to module with Scene only', async () => {
        const entry = getSceneEntry('flow-shader')!
        expect(entry.tunable).toBe(false)
        if (entry.tunable) return // type narrow
        const mod = await entry.loader()
        expect(typeof mod.Scene).toBe('function')
    })

    test('audio-reactive — static entry resolves to module with Scene only', async () => {
        const entry = getSceneEntry('audio-reactive')!
        expect(entry.tunable).toBe(false)
        if (entry.tunable) return
        const mod = await entry.loader()
        expect(typeof mod.Scene).toBe('function')
    })
})

// Compile-time guarantee: the discriminated SceneEntry union forces a
// `tunable: true` entry to declare a loader whose return promise includes
// SCHEMA. If this stops compiling, the registry's whole point — catching
// drift between the tunable flag and the module's actual exports — is
// lost. The @ts-expect-error must be present (not stripped) for this
// guarantee to be enforced.
describe('SceneEntry — discriminant catches drift (compile-time)', () => {
    test('a tunable: true entry whose loader lacks SCHEMA fails to typecheck', () => {
        // @ts-expect-error — flow-shader has no SCHEMA export; the
        // discriminant union requires a tunable entry's loader to resolve
        // to { Scene, SCHEMA }.
        const _badEntry: SceneEntry = {
            scene: {
                id: 'flow-shader',
                accentColor: '#000000',
                fallbackColors: ['#000000', '#000000'],
                fallbackPng: '/x.png',
            },
            tunable: true,
            loader: () => import('./flow-shader'),
        }
        void _badEntry
    })
})
