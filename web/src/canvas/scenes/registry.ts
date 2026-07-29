import type { ComponentType } from 'react'
import type { SceneParamSchema } from './paramSchema'

// Canonical scene-id union — replaces stringly-typed Record keys
// throughout the codebase. Every scene module's identity flows
// through this type.
export type SceneId =
    | 'flow-shader'
    | 'particles-starfield'
    | 'particles-cursor'
    | 'particles-flow'
    | 'particles-boids'
    | 'geometric-reaction-diffusion'
    | 'geometric-voronoi'
    | 'geometric-subdivision'
    | 'audio-reactive'

// Eager metadata used by BackgroundGallery for the <select> menu,
// fallback rendering, and the --color-accent CSS variable. Narrowed
// to the metadata-only facets — no Component field. The runtime
// component is reached via the entry's typed loader.
export interface BackgroundScene {
    id: SceneId
    accentColor: string
    fallbackColors: readonly [string, string]
    fallbackPng: string
}

type SceneComponent = ComponentType<{ params?: Record<string, unknown> }>

// Discriminated entry. The `tunable: true | false` literal narrows
// the loader's return-promise shape: a tunable entry MUST resolve
// to a module exposing both Scene and SCHEMA; a non-tunable entry
// resolves to a module exposing Scene only. TypeScript rejects an
// entry whose `tunable` flag drifts from what its module actually
// exports.
interface TunableEntry {
    scene: BackgroundScene
    tunable: true
    loader: () => Promise<{ Scene: SceneComponent; SCHEMA: SceneParamSchema }>
}
interface StaticEntry {
    scene: BackgroundScene
    tunable: false
    loader: () => Promise<{ Scene: SceneComponent }>
}
export type SceneEntry = TunableEntry | StaticEntry

// Static import() literals — each path is visible to Vite's chunk
// analyzer, so the bundler emits one chunk per scene.
export const SCENE_REGISTRY = [
    {
        scene: {
            id: 'flow-shader',
            accentColor: '#c19a4b',
            fallbackColors: ['#ffffff', '#ff6a00'],
            fallbackPng: '/fallbacks/flow-shader.png',
        },
        tunable: false,
        loader: () => import('./flow-shader'),
    },
    {
        scene: {
            id: 'particles-starfield',
            accentColor: '#5fb6c4',
            fallbackColors: ['#070a18', '#5fb6c4'],
            fallbackPng: '/fallbacks/particles-starfield.png',
        },
        tunable: true,
        loader: () => import('./particles-starfield'),
    },
    {
        scene: {
            id: 'particles-cursor',
            accentColor: '#25db00',
            fallbackColors: ['#0e0816', '#25db00'],
            fallbackPng: '/fallbacks/particles-cursor.png',
        },
        tunable: true,
        loader: () => import('./particles-cursor'),
    },
    {
        scene: {
            id: 'particles-flow',
            accentColor: '#ffffff',
            fallbackColors: ['#08608c', '#ffffff'],
            fallbackPng: '/fallbacks/particles-flow.png',
        },
        tunable: true,
        loader: () => import('./particles-flow'),
    },
    {
        scene: {
            id: 'particles-boids',
            accentColor: '#ddba92',
            fallbackColors: ['#0c2036', '#ddba92'],
            fallbackPng: '/fallbacks/particles-boids.png',
        },
        tunable: true,
        loader: () => import('./particles-boids'),
    },
    {
        scene: {
            id: 'geometric-reaction-diffusion',
            accentColor: '#d0b9df',
            fallbackColors: ['#ffd6d6', '#d0b9df'],
            fallbackPng: '/fallbacks/geometric-reaction-diffusion.png',
        },
        tunable: true,
        loader: () => import('./geometric-reaction-diffusion'),
    },
    {
        scene: {
            id: 'geometric-voronoi',
            accentColor: '#ffffff',
            fallbackColors: ['#485f8e', '#ffffff'],
            fallbackPng: '/fallbacks/geometric-voronoi.png',
        },
        tunable: true,
        loader: () => import('./geometric-voronoi'),
    },
    {
        scene: {
            id: 'geometric-subdivision',
            accentColor: '#700000',
            fallbackColors: ['#700000', '#000000'],
            fallbackPng: '/fallbacks/geometric-subdivision.png',
        },
        tunable: true,
        loader: () => import('./geometric-subdivision'),
    },
    {
        scene: {
            id: 'audio-reactive',
            accentColor: '#d97a5b',
            fallbackColors: ['#1f0e0e', '#d97a5b'],
            fallbackPng: '/fallbacks/audio-reactive.png',
        },
        tunable: false,
        loader: () => import('./audio-reactive'),
    },
] as const satisfies readonly SceneEntry[]

export const BACKGROUND_SCENES: readonly BackgroundScene[] = SCENE_REGISTRY.map(
    (e) => e.scene,
)

/**
 * No production consumer since task-044: this enumerated `/sandbox/scenes/:id`
 * for the prerender set, and those routes no longer ship (decision O5). The
 * Tuner resolves a single entry by URL param via `getSceneEntry`, so it never
 * needed the list. Kept because it is the iteration source for the registry's
 * tunable-module tests and stays correct as scenes are added — if the sandbox
 * routes are ever dropped from `App.tsx` too, delete this with them.
 */
export const TUNABLE_SCENE_IDS: readonly SceneId[] = SCENE_REGISTRY.filter(
    (e) => e.tunable,
).map((e) => e.scene.id)

const sceneEntryById = new Map<SceneId, SceneEntry>(
    SCENE_REGISTRY.map((e) => [e.scene.id, e]),
)

export function getSceneEntry(id: SceneId): SceneEntry | undefined {
    return sceneEntryById.get(id)
}
