import { createSubscribable } from '../state/subscribable'
import type { BackgroundScene } from './types'

export const STORAGE_KEY = 'chaipalaka.background.activeId'

interface Storage {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
}

interface Root {
    style: { setProperty(name: string, value: string): void }
}

export interface GalleryDeps {
    scenes: readonly BackgroundScene[]
    storage?: Storage
    root?: Root
    defaultId: string
}

export interface BackgroundGallery {
    get(): BackgroundScene
    getActive(): BackgroundScene
    setActive(id: string): void
    subscribe(listener: (active: BackgroundScene) => void): () => void
}

export function createGallery(deps: GalleryDeps): BackgroundGallery {
    const { defaultId, storage, root } = deps

    const sceneById = new Map<string, BackgroundScene>()
    for (const scene of deps.scenes) {
        if (sceneById.has(scene.id)) {
            throw new Error(`Duplicate background scene id: ${scene.id}`)
        }
        sceneById.set(scene.id, scene)
    }

    function pickInitial(): BackgroundScene {
        if (storage) {
            const persisted = storage.getItem(STORAGE_KEY)
            if (persisted && sceneById.has(persisted)) {
                return sceneById.get(persisted)!
            }
        }
        const def = sceneById.get(defaultId)
        if (!def)
            throw new Error(
                `BackgroundGallery: defaultId "${defaultId}" not found in registry`,
            )
        return def
    }

    function writeAccent(scene: BackgroundScene) {
        root?.style.setProperty('--color-accent', scene.accentColor)
    }

    const initial = pickInitial()
    const state = createSubscribable<BackgroundScene>(initial)
    state.subscribe(writeAccent)
    writeAccent(initial)

    return {
        get: state.get,
        getActive: state.get,

        setActive(id: string) {
            const scene = sceneById.get(id)
            if (!scene) {
                console.warn(`BackgroundGallery.setActive: unknown id "${id}"`)
                return
            }
            storage?.setItem(STORAGE_KEY, id)
            state.set(scene)
        },

        subscribe: state.subscribe,
    }
}
