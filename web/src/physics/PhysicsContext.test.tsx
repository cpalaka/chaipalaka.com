import { describe, test, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
    vi.restoreAllMocks()
})

async function setup() {
    const rtl = await import('@testing-library/react')
    const ctx = await import('./PhysicsContext')
    const { PhysicsWorld } = await import('./PhysicsWorld')
    const { getFrameEdgeController } = await import('../canvas/useFrameEdge')
    return { ...rtl, ...ctx, PhysicsWorld, getFrameEdgeController }
}

describe('usePhysicsWorld', () => {
    test('throws outside <PhysicsProvider> with the documented message', async () => {
        const { renderHook, usePhysicsWorld } = await setup()
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => renderHook(() => usePhysicsWorld())).toThrow(
            'usePhysicsWorld: must be used inside <PhysicsProvider>',
        )
        spy.mockRestore()
    })

    test('inside <PhysicsProvider> returns a PhysicsWorld instance', async () => {
        const { renderHook, usePhysicsWorld, PhysicsProvider, PhysicsWorld } =
            await setup()
        const { result } = renderHook(() => usePhysicsWorld(), {
            wrapper: ({ children }) => (
                <PhysicsProvider>{children}</PhysicsProvider>
            ),
        })
        expect(result.current).toBeInstanceOf(PhysicsWorld)
    })
})

describe('edgeToInsets', () => {
    test("'top' → { top: FRAME_BAR_HEIGHT, bottom: 0 }", async () => {
        const { edgeToInsets, FRAME_BAR_HEIGHT } = await setup()
        expect(edgeToInsets('top')).toEqual({
            top: FRAME_BAR_HEIGHT,
            bottom: 0,
        })
    })

    test("'bottom' → { top: 0, bottom: FRAME_BAR_HEIGHT }", async () => {
        const { edgeToInsets, FRAME_BAR_HEIGHT } = await setup()
        expect(edgeToInsets('bottom')).toEqual({
            top: 0,
            bottom: FRAME_BAR_HEIGHT,
        })
    })
})

describe('PhysicsProvider', () => {
    test('initializes the world with the current window viewport', async () => {
        const { render, PhysicsProvider, usePhysicsWorld } = await setup()
        let captured: ReturnType<typeof usePhysicsWorld> | null = null
        function Probe() {
            captured = usePhysicsWorld()
            return null
        }
        render(
            <PhysicsProvider>
                <Probe />
            </PhysicsProvider>,
        )
        expect(captured).not.toBeNull()
        // setViewport runs synchronously in the mount effect; the floor
        // body's centre x reflects the resulting viewport width.
        const world = captured!
        const floor = world.getPosition(world.floorHandle)
        expect(floor.x).toBe(window.innerWidth / 2)
    })

    test('constructs the world in drift mode — the site default (AC#2 / spec §3.2)', async () => {
        const { render, PhysicsProvider, usePhysicsWorld } = await setup()
        let captured: ReturnType<typeof usePhysicsWorld> | null = null
        function Probe() {
            captured = usePhysicsWorld()
            return null
        }
        render(
            <PhysicsProvider>
                <Probe />
            </PhysicsProvider>,
        )
        // A PageSpec-less physics route (blog, /sandbox/cards) never reaches
        // usePageDef, so PhysicsProvider itself must resolve the drift default —
        // otherwise the world sticks at the constructor's dormant 'gravity'.
        const world = captured!
        expect(world.getMode()).toBe('drift')
        expect(world.getGravityVector()).toEqual({ x: 0, y: 0 })
    })

    test('window resize calls setViewport with new dims and current insets', async () => {
        const { act, render, PhysicsProvider, usePhysicsWorld } = await setup()
        let captured: ReturnType<typeof usePhysicsWorld> | null = null
        function Probe() {
            captured = usePhysicsWorld()
            return null
        }
        render(
            <PhysicsProvider>
                <Probe />
            </PhysicsProvider>,
        )
        const spy = vi.spyOn(captured!, 'setViewport')
        act(() => {
            ;(window as unknown as { innerWidth: number }).innerWidth = 1234
            ;(window as unknown as { innerHeight: number }).innerHeight = 567
            window.dispatchEvent(new Event('resize'))
        })
        expect(spy).toHaveBeenCalledWith(
            { width: 1234, height: 567 },
            { top: 0, bottom: 40 },
        )
    })

    test('frame-edge change re-applies viewport with the new insets', async () => {
        const {
            act,
            render,
            PhysicsProvider,
            usePhysicsWorld,
            getFrameEdgeController,
        } = await setup()
        let captured: ReturnType<typeof usePhysicsWorld> | null = null
        function Probe() {
            captured = usePhysicsWorld()
            return null
        }
        render(
            <PhysicsProvider>
                <Probe />
            </PhysicsProvider>,
        )
        const spy = vi.spyOn(captured!, 'setViewport')
        act(() => {
            getFrameEdgeController().setEdge('top')
        })
        expect(spy).toHaveBeenCalledWith(
            { width: window.innerWidth, height: window.innerHeight },
            { top: 40, bottom: 0 },
        )
    })

    test('unmount removes the resize listener', async () => {
        const { render, PhysicsProvider, usePhysicsWorld } = await setup()
        let captured: ReturnType<typeof usePhysicsWorld> | null = null
        function Probe() {
            captured = usePhysicsWorld()
            return null
        }
        const { unmount } = render(
            <PhysicsProvider>
                <Probe />
            </PhysicsProvider>,
        )
        const spy = vi.spyOn(captured!, 'setViewport')
        unmount()
        const before = spy.mock.calls.length
        window.dispatchEvent(new Event('resize'))
        expect(spy.mock.calls.length).toBe(before)
    })
})
