import type { BackgroundRegistry, BackgroundScene } from './types'

export function createRegistry(
    scenes: readonly BackgroundScene[],
): BackgroundRegistry {
    const map = new Map<string, BackgroundScene>()
    for (const scene of scenes) {
        if (map.has(scene.id)) {
            throw new Error(`Duplicate background scene id: ${scene.id}`)
        }
        map.set(scene.id, scene)
    }
    const ordered = Array.from(map.values())
    return {
        get: (id) => map.get(id),
        has: (id) => map.has(id),
        list: () => ordered,
    }
}
