import { describe, test, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { PhysicsProvider } from './PhysicsContext'
import { PhysicsWorld } from './PhysicsWorld'
import { usePageDef } from './usePageDef'
import type { PageSpec } from './PageSpec'

afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
})

function Consumer({ def }: { def: PageSpec }) {
    usePageDef(def)
    return null
}

function renderDef(def: PageSpec) {
    return render(
        <PhysicsProvider>
            <Consumer def={def} />
        </PhysicsProvider>,
    )
}

describe('usePageDef', () => {
    // AC#2 — a route with no `mode` runs drift; gravity direction is NOT applied.
    test('no mode ⇒ drift: sets mode drift, driftScale 1, no gravity direction', () => {
        const mode = vi.spyOn(PhysicsWorld.prototype, 'setMode')
        const scale = vi.spyOn(PhysicsWorld.prototype, 'setDriftScale')
        const grav = vi.spyOn(PhysicsWorld.prototype, 'setGravityDirection')
        renderDef({ cards: [] })
        expect(mode).toHaveBeenCalledWith('drift')
        expect(scale).toHaveBeenCalledWith(1)
        // A declared gravity is ignored under drift.
        renderDef({ gravity: 'up', cards: [] })
        expect(grav).not.toHaveBeenCalledWith('up')
    })

    test('mode:"gravity" ⇒ sets gravity mode and the declared direction', () => {
        const mode = vi.spyOn(PhysicsWorld.prototype, 'setMode')
        const grav = vi.spyOn(PhysicsWorld.prototype, 'setGravityDirection')
        renderDef({ mode: 'gravity', gravity: 'up', cards: [] })
        expect(mode).toHaveBeenCalledWith('gravity')
        expect(grav).toHaveBeenCalledWith('up')
    })

    test('mode:"gravity" with no direction defaults to "down"', () => {
        const grav = vi.spyOn(PhysicsWorld.prototype, 'setGravityDirection')
        renderDef({ mode: 'gravity', cards: [] })
        expect(grav).toHaveBeenCalledWith('down')
    })

    // AC#4 — driftScale plumbs through to the world.
    test('driftScale plumbs through; defaults to 1 when absent', () => {
        const scale = vi.spyOn(PhysicsWorld.prototype, 'setDriftScale')
        renderDef({ driftScale: 0.3, cards: [] })
        expect(scale).toHaveBeenCalledWith(0.3)
        scale.mockClear()
        renderDef({ cards: [] })
        expect(scale).toHaveBeenCalledWith(1)
    })

    // AC#4 / D8 — prefers-reduced-motion forces driftScale 0, overriding the
    // route's authored intensity, so a reduced-motion user sees no drift (the
    // repel is driftScale-gated too, AC#10). Drag/peek stay live — separate paths.
    test('prefers-reduced-motion ⇒ driftScale 0 (overrides the authored value)', () => {
        const mql = {
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }
        vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
        try {
            const scale = vi.spyOn(PhysicsWorld.prototype, 'setDriftScale')
            renderDef({ driftScale: 0.9, cards: [] })
            expect(scale).toHaveBeenLastCalledWith(0)
            // ④ (review): the FIRST effect pass already reads reduced-motion
            // synchronously, so the authored value never reaches the world — no
            // one-frame window at 0.9 for the rAF loop to tick through.
            expect(scale).not.toHaveBeenCalledWith(0.9)
        } finally {
            vi.unstubAllGlobals()
        }
    })

    test('unmount resets to the site default (drift, scale 1, gravity down)', () => {
        const mode = vi.spyOn(PhysicsWorld.prototype, 'setMode')
        const scale = vi.spyOn(PhysicsWorld.prototype, 'setDriftScale')
        const grav = vi.spyOn(PhysicsWorld.prototype, 'setGravityDirection')
        const { unmount } = renderDef({ mode: 'gravity', gravity: 'up', cards: [] })
        mode.mockClear()
        scale.mockClear()
        grav.mockClear()
        unmount()
        expect(mode).toHaveBeenCalledWith('drift')
        expect(scale).toHaveBeenCalledWith(1)
        expect(grav).toHaveBeenCalledWith('down')
    })

    test('a stable pageDef does not re-invoke on re-render', () => {
        const mode = vi.spyOn(PhysicsWorld.prototype, 'setMode')
        const def: PageSpec = { driftScale: 0.5, cards: [] }
        const { rerender } = render(
            <PhysicsProvider>
                <Consumer def={def} />
            </PhysicsProvider>,
        )
        const afterMount = mode.mock.calls.length
        rerender(
            <PhysicsProvider>
                <Consumer def={def} />
            </PhysicsProvider>,
        )
        expect(mode.mock.calls.length).toBe(afterMount)
    })
})
