import type { BackgroundScene } from '../types'
import rawManifest from './manifest.json'

interface ManifestEntry {
    id: string
    accentColor: string
    fallbackColors: [string, string]
    fallbackPng: string
}
const manifest = rawManifest as ManifestEntry[]

// Component is a placeholder here — BackgroundCanvas loads the real
// implementation lazily via dynamic import(). The gallery only uses id,
// accentColor, fallbackColors, and fallbackPng from these entries.
function Placeholder() {
    return null
}

export const backgroundScenes: readonly BackgroundScene[] = manifest.map(
    (entry): BackgroundScene => ({
        id: entry.id,
        accentColor: entry.accentColor,
        fallbackColors: entry.fallbackColors as readonly [string, string],
        fallbackPng: entry.fallbackPng,
        Component: Placeholder,
    }),
)
