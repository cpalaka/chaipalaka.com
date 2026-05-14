import type { ComponentType } from 'react'
import type { SceneParamSchema } from './paramSchema'

export interface TunableSceneModule {
    SCHEMA: SceneParamSchema
    Scene: ComponentType<{ params?: Record<string, unknown> }>
}

export const tunableSceneLoaders: Record<string, () => Promise<TunableSceneModule>> = {
    'particles-boids':              () => import('./particles-boids') as Promise<TunableSceneModule>,
    'particles-flow':               () => import('./particles-flow') as Promise<TunableSceneModule>,
    'particles-cursor':             () => import('./particles-cursor') as Promise<TunableSceneModule>,
    'particles-starfield':          () => import('./particles-starfield') as Promise<TunableSceneModule>,
    'geometric-reaction-diffusion': () => import('./geometric-reaction-diffusion') as Promise<TunableSceneModule>,
    'geometric-voronoi':            () => import('./geometric-voronoi') as Promise<TunableSceneModule>,
    'geometric-subdivision':        () => import('./geometric-subdivision') as Promise<TunableSceneModule>,
}

export const TUNABLE_SCENE_IDS: readonly string[] = Object.keys(tunableSceneLoaders)
