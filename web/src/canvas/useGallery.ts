import { useEffect } from 'react'
import { backgroundScenes } from './scenes'
import { createGallery, STORAGE_KEY } from './gallery'
import type { BackgroundGallery } from './gallery'
import type { BackgroundScene } from './types'
import { useController } from '../state/useController'

declare global {
    interface Window {
        __setBackground: (id: string) => void
    }
}

// Singleton — one gallery per module load, backed by real browser storage.
// Guarded so SSG/SSR (no window/localStorage) doesn't throw.
let galleryInstance: BackgroundGallery | null = null

function getGallery(): BackgroundGallery {
    if (galleryInstance) return galleryInstance

    const storage =
        typeof localStorage !== 'undefined'
            ? {
                  getItem: (k: string) => localStorage.getItem(k),
                  setItem: (k: string, v: string) => localStorage.setItem(k, v),
              }
            : undefined

    // One-shot migrations: redirect retired placeholder ids to their replacements.
    const persisted = storage?.getItem(STORAGE_KEY)
    if (persisted === 'particles') {
        storage!.setItem(STORAGE_KEY, 'particles-starfield')
    } else if (persisted === 'geometric') {
        storage!.setItem(STORAGE_KEY, 'geometric-reaction-diffusion')
    }

    const root =
        typeof document !== 'undefined' ? document.documentElement : undefined

    galleryInstance = createGallery({
        scenes: backgroundScenes,
        storage,
        root,
        defaultId: 'flow-shader',
    })
    return galleryInstance
}

export function useGallery(): {
    active: BackgroundScene
    setActive: (id: string) => void
} {
    const gallery = getGallery()
    const active = useController(getGallery)

    useEffect(() => {
        window.__setBackground = (id: string) => gallery.setActive(id)
    }, [gallery])

    return { active, setActive: (id) => gallery.setActive(id) }
}

export { STORAGE_KEY }
