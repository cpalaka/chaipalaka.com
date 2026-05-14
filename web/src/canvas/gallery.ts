import { createRegistry } from './registry'
import type { BackgroundRegistry, BackgroundScene } from './types'

export const STORAGE_KEY = 'chaipalaka.background.activeId'

interface Storage {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
}

interface Root {
    style: { setProperty(name: string, value: string): void }
}

export interface GalleryDeps {
    registry: BackgroundRegistry
    storage?: Storage
    root?: Root
    defaultId: string
}

export interface BackgroundGallery {
    get(): BackgroundScene
    getActive(): BackgroundScene
    setActive(id: string): void
    register(scene: BackgroundScene): void
    subscribe(listener: (active: BackgroundScene) => void): () => void
    destroy(): void
}

export function createGallery(deps: GalleryDeps): BackgroundGallery {
    const { defaultId, storage, root } = deps

    // Mutable registry so register() can add scenes after construction.
    // We rebuild it on each register() call to preserve the uniqueness guarantee.
    let scenes = deps.registry.list().slice()
    let reg = deps.registry

    function resolveRegistry(
        list: readonly BackgroundScene[],
    ): BackgroundRegistry {
        return createRegistry(list)
    }

    function pickInitial(): BackgroundScene {
        if (storage) {
            const persisted = storage.getItem(STORAGE_KEY)
            if (persisted && reg.has(persisted)) {
                return reg.get(persisted)!
            }
        }
        const def = reg.get(defaultId)
        if (!def)
            throw new Error(
                `BackgroundGallery: defaultId "${defaultId}" not found in registry`,
            )
        return def
    }

    let active = pickInitial()
    const listeners = new Set<(active: BackgroundScene) => void>()

    function writeAccent(scene: BackgroundScene) {
        root?.style.setProperty('--color-accent', scene.accentColor)
    }

    writeAccent(active)

    return {
        get: () => active,
        getActive: () => active,

        setActive(id: string) {
            const scene = reg.get(id)
            if (!scene) {
                console.warn(`BackgroundGallery.setActive: unknown id "${id}"`)
                return
            }
            active = scene
            storage?.setItem(STORAGE_KEY, id)
            writeAccent(scene)
            for (const l of listeners) l(scene)
        },

        register(scene: BackgroundScene) {
            scenes = [...scenes, scene]
            reg = resolveRegistry(scenes)
        },

        subscribe(listener: (active: BackgroundScene) => void) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },

        destroy() {
            listeners.clear()
        },
    }
}
