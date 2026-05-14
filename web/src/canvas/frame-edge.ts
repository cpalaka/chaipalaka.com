import { createSubscribable } from '../state/subscribable'

export type FrameEdge = 'top' | 'bottom'

export const FRAME_EDGE_STORAGE_KEY = 'chaipalaka.frame.edge'

export interface FrameEdgeController {
    get(): FrameEdge
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
    const state = createSubscribable<FrameEdge>(readEdge(storage))

    function commit(next: FrameEdge) {
        storage.set(FRAME_EDGE_STORAGE_KEY, next)
        state.set(next)
    }

    return {
        get: state.get,
        getEdge: state.get,

        setEdge(edge: FrameEdge) {
            commit(edge)
        },

        toggleEdge() {
            commit(state.get() === 'bottom' ? 'top' : 'bottom')
        },

        subscribe: state.subscribe,
    }
}
