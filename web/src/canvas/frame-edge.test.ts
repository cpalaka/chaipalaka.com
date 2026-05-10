import { describe, test, expect } from 'vitest'
import { createFrameEdgeController, FRAME_EDGE_STORAGE_KEY } from './frame-edge'

type Storage = Map<string, string>

function fakeStorage(init: Record<string, string> = {}): Storage {
    return new Map(Object.entries(init))
}

describe('frame-edge controller initialisation', () => {
    test('defaults to bottom when storage is empty', () => {
        const ctrl = createFrameEdgeController({ storage: fakeStorage() })
        expect(ctrl.getEdge()).toBe('bottom')
    })

    test('persists default bottom to storage on first read', () => {
        const storage = fakeStorage()
        createFrameEdgeController({ storage })
        expect(storage.get(FRAME_EDGE_STORAGE_KEY)).toBe('bottom')
    })

    test('reads persisted top from storage', () => {
        const ctrl = createFrameEdgeController({
            storage: fakeStorage({ [FRAME_EDGE_STORAGE_KEY]: 'top' }),
        })
        expect(ctrl.getEdge()).toBe('top')
    })

    test('reads persisted bottom from storage', () => {
        const ctrl = createFrameEdgeController({
            storage: fakeStorage({ [FRAME_EDGE_STORAGE_KEY]: 'bottom' }),
        })
        expect(ctrl.getEdge()).toBe('bottom')
    })

    test('falls back to bottom for unrecognised stored value and re-persists', () => {
        const storage = fakeStorage({ [FRAME_EDGE_STORAGE_KEY]: 'left' })
        const ctrl = createFrameEdgeController({ storage })
        expect(ctrl.getEdge()).toBe('bottom')
        expect(storage.get(FRAME_EDGE_STORAGE_KEY)).toBe('bottom')
    })
})

describe('frame-edge controller setEdge', () => {
    test('updates the current edge', () => {
        const ctrl = createFrameEdgeController({ storage: fakeStorage() })
        ctrl.setEdge('top')
        expect(ctrl.getEdge()).toBe('top')
    })

    test('persists the new value to storage', () => {
        const storage = fakeStorage()
        const ctrl = createFrameEdgeController({ storage })
        ctrl.setEdge('top')
        expect(storage.get(FRAME_EDGE_STORAGE_KEY)).toBe('top')
    })
})

describe('frame-edge controller toggleEdge', () => {
    test('flips bottom to top', () => {
        const ctrl = createFrameEdgeController({ storage: fakeStorage() })
        expect(ctrl.getEdge()).toBe('bottom')
        ctrl.toggleEdge()
        expect(ctrl.getEdge()).toBe('top')
    })

    test('flips top to bottom', () => {
        const ctrl = createFrameEdgeController({
            storage: fakeStorage({ [FRAME_EDGE_STORAGE_KEY]: 'top' }),
        })
        ctrl.toggleEdge()
        expect(ctrl.getEdge()).toBe('bottom')
    })

    test('persists the toggled value', () => {
        const storage = fakeStorage()
        const ctrl = createFrameEdgeController({ storage })
        ctrl.toggleEdge()
        expect(storage.get(FRAME_EDGE_STORAGE_KEY)).toBe('top')
    })
})

describe('frame-edge controller subscribe', () => {
    test('listener fires on setEdge with the new edge', () => {
        const ctrl = createFrameEdgeController({ storage: fakeStorage() })
        const seen: string[] = []
        ctrl.subscribe((e) => seen.push(e))
        ctrl.setEdge('top')
        ctrl.setEdge('bottom')
        expect(seen).toEqual(['top', 'bottom'])
    })

    test('listener fires on toggleEdge with the new edge', () => {
        const ctrl = createFrameEdgeController({ storage: fakeStorage() })
        const seen: string[] = []
        ctrl.subscribe((e) => seen.push(e))
        ctrl.toggleEdge()
        expect(seen).toEqual(['top'])
    })

    test('unsubscribe stops further notifications', () => {
        const ctrl = createFrameEdgeController({ storage: fakeStorage() })
        const seen: string[] = []
        const unsub = ctrl.subscribe((e) => seen.push(e))
        ctrl.toggleEdge()
        unsub()
        ctrl.toggleEdge()
        expect(seen).toEqual(['top'])
    })
})
