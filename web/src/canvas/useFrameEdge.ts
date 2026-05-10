import { useEffect, useState } from 'react'
import {
    createFrameEdgeController,
    FRAME_EDGE_STORAGE_KEY,
} from './frame-edge'
import type { FrameEdge } from './frame-edge'

function makeStorage(): Map<string, string> {
    const m = new Map<string, string>()
    if (typeof localStorage !== 'undefined') {
        const persisted = localStorage.getItem(FRAME_EDGE_STORAGE_KEY)
        if (persisted) m.set(FRAME_EDGE_STORAGE_KEY, persisted)
        const original = m.set.bind(m)
        m.set = (k, v) => {
            localStorage.setItem(k, v)
            return original(k, v)
        }
    }
    return m
}

let controllerInstance: ReturnType<typeof createFrameEdgeController> | null =
    null

function getController() {
    if (!controllerInstance) {
        controllerInstance = createFrameEdgeController({ storage: makeStorage() })
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
    const [edge, setEdgeState] = useState(() => ctrl.getEdge())

    useEffect(() => {
        const unsub = ctrl.subscribe((e) => setEdgeState(e))
        return unsub
    }, [ctrl])

    return {
        edge,
        setEdge: (e: FrameEdge) => ctrl.setEdge(e),
        toggleEdge: () => ctrl.toggleEdge(),
    }
}

export type { FrameEdge }
