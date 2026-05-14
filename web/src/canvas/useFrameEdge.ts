import {
    createFrameEdgeController,
    FRAME_EDGE_STORAGE_KEY,
} from './frame-edge'
import type { FrameEdge } from './frame-edge'
import { useController } from '../state/useController'
import { persistentMap } from '../state/persistentMap'

let controllerInstance: ReturnType<typeof createFrameEdgeController> | null =
    null

function getController() {
    if (!controllerInstance) {
        controllerInstance = createFrameEdgeController({
            storage: persistentMap(FRAME_EDGE_STORAGE_KEY),
        })
    }
    return controllerInstance
}

export function getFrameEdgeController() {
    return getController()
}

export function useFrameEdge(): {
    edge: FrameEdge
    setEdge: (e: FrameEdge) => void
    toggleEdge: () => void
} {
    const ctrl = getController()
    const edge = useController(getController)

    return {
        edge,
        setEdge: (e: FrameEdge) => ctrl.setEdge(e),
        toggleEdge: () => ctrl.toggleEdge(),
    }
}

export type { FrameEdge }
