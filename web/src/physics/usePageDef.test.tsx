import { describe, test, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { PhysicsProvider } from './PhysicsContext'
import { PhysicsWorld } from './PhysicsWorld'
import { usePageDef } from './usePageDef'
import type { PageSpec } from './PageSpec'
import type { Cardinal } from './PhysicsWorld'

afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
})

function pageDef(gravity: Cardinal): PageSpec {
    return { gravity, cards: [] }
}

function Consumer({ def }: { def: PageSpec }) {
    usePageDef(def)
    return null
}

describe('usePageDef', () => {
    test('mount calls setGravityDirection with pageDef.gravity', () => {
        const spy = vi.spyOn(PhysicsWorld.prototype, 'setGravityDirection')
        render(
            <PhysicsProvider>
                <Consumer def={pageDef('up')} />
            </PhysicsProvider>,
        )
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith('up')
    })

    test('unmount restores gravity to "down"', () => {
        const spy = vi.spyOn(PhysicsWorld.prototype, 'setGravityDirection')
        const { unmount } = render(
            <PhysicsProvider>
                <Consumer def={pageDef('up')} />
            </PhysicsProvider>,
        )
        spy.mockClear()
        unmount()
        expect(spy).toHaveBeenCalledWith('down')
    })

    test('changing pageDef.gravity re-applies it (cleanup-then-effect)', () => {
        const spy = vi.spyOn(PhysicsWorld.prototype, 'setGravityDirection')
        const { rerender } = render(
            <PhysicsProvider>
                <Consumer def={pageDef('up')} />
            </PhysicsProvider>,
        )
        spy.mockClear()
        rerender(
            <PhysicsProvider>
                <Consumer def={pageDef('left')} />
            </PhysicsProvider>,
        )
        const args = spy.mock.calls.map((c) => c[0])
        // useEffect cleanup with old deps fires first (restores 'down'),
        // then new effect applies the new gravity.
        expect(args).toEqual(['down', 'left'])
    })

    test('no-op re-render with stable world+gravity does not re-invoke', () => {
        const spy = vi.spyOn(PhysicsWorld.prototype, 'setGravityDirection')
        const def = pageDef('right')
        const { rerender } = render(
            <PhysicsProvider>
                <Consumer def={def} />
            </PhysicsProvider>,
        )
        const callsAfterMount = spy.mock.calls.length
        rerender(
            <PhysicsProvider>
                <Consumer def={def} />
            </PhysicsProvider>,
        )
        expect(spy.mock.calls.length).toBe(callsAfterMount)
    })
})
