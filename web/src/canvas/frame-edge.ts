export type FrameEdge = 'top' | 'bottom'

export const FRAME_EDGE_STORAGE_KEY = 'chaipalaka.frame.edge'

export interface FrameEdgeController {
    getEdge(): FrameEdge
    setEdge(edge: FrameEdge): void
    toggleEdge(): void
    subscribe(listener: (edge: FrameEdge) => void): () => void
}

export interface FrameEdgeControllerDeps {
    storage: Map<string, string>
}

function readEdge(storage: Map<string, string>): FrameEdge {
    const stored = storage.get(FRAME_EDGE_STORAGE_KEY)
    if (stored === 'top' || stored === 'bottom') {
        return stored
    }
    storage.set(FRAME_EDGE_STORAGE_KEY, 'bottom')
    return 'bottom'
}

export function createFrameEdgeController(
    deps: FrameEdgeControllerDeps,
): FrameEdgeController {
    const { storage } = deps
    let current: FrameEdge = readEdge(storage)
    const listeners = new Set<(edge: FrameEdge) => void>()

    return {
        getEdge() {
            return current
        },

        setEdge(edge: FrameEdge) {
            current = edge
            storage.set(FRAME_EDGE_STORAGE_KEY, current)
            for (const l of listeners) l(current)
        },

        toggleEdge() {
            current = current === 'bottom' ? 'top' : 'bottom'
            storage.set(FRAME_EDGE_STORAGE_KEY, current)
            for (const l of listeners) l(current)
        },

        subscribe(listener) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
    }
}
