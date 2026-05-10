import { useEffect, useState } from 'react'
import { backgroundScenes } from './scenes'
import { createRegistry } from './registry'
import { createGallery, STORAGE_KEY } from './gallery'
import type { BackgroundGallery } from './gallery'
import type { BackgroundScene } from './types'

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

    const root =
        typeof document !== 'undefined' ? document.documentElement : undefined

    galleryInstance = createGallery({
        registry: createRegistry(backgroundScenes),
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
    const [active, setActive] = useState(() => gallery.getActive())

    useEffect(() => {
        // Install debug hook for QA and for slice-18 UI to override.
        window.__setBackground = (id: string) => gallery.setActive(id)
        const unsub = gallery.subscribe((next) => setActive(next))
        return () => {
            unsub()
        }
    }, [gallery])

    return { active, setActive: (id) => gallery.setActive(id) }
}

export { STORAGE_KEY }
