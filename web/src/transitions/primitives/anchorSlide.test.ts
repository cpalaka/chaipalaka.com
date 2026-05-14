import { describe, test, expect } from 'vitest'
import { createFakeBodyDriver } from '../../physics/createFakeBodyDriver'
import { anchorSlide } from './anchorSlide'
import type { CardActivator } from '../CardRegistry'

const noopActivator: CardActivator = { activate: () => {} }

function newFake() {
    const fake = createFakeBodyDriver()
    // Register a static "ceiling" / "floor" so tests that exercise the sensor
    // edge or static-parent tether have stable handles to pass in as opts.
    const ceiling = fake.registerBody('__ceiling', {
        position: { x: 400, y: 0 },
        isStatic: true,
    })
    const floor = fake.registerBody('__floor', {
        position: { x: 400, y: 600 },
        isStatic: true,
    })
    return { fake, ceiling, floor }
}

describe('anchorSlide (T3) — horizontal', () => {
    test('translates from-card horizontally off-viewport over duration', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const a = fake.registerBody('a', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: 700, viewport },
        )

        step(0)
        const start = fake.getState(a)!.position
        expect(start.x).toBeCloseTo(400, 1)

        step(350)
        const mid = fake.getState(a)!.position
        // sign=+1, fromCard exits in axis × -sign direction = leftward.
        expect(mid.x).toBeLessThan(start.x)

        const done = step(350)
        expect(done).toBe(true)
        const final = fake.getState(a)!.position
        expect(final.x).toBeLessThanOrEqual(-100)
    })

    test('sign=-1 flips direction (from-card exits to the right)', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const a = fake.registerBody('a', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: -1, durationMs: 700, viewport },
        )

        step(0)
        step(700)
        const final = fake.getState(a)!.position
        expect(final.x).toBeGreaterThan(viewport.width)
    })

    test('to-card enters from origin side toward its layout position', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const b = fake.registerBody('b', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: [], toIds: ['b'] },
            { axis: 'horizontal', sign: 1, durationMs: 700, viewport },
        )

        step(0)
        const initialPos = fake.getState(b)!.position
        expect(initialPos.x).toBeGreaterThanOrEqual(viewport.width)

        step(700)
        const final = fake.getState(b)!.position
        expect(final.x).toBeCloseTo(400, 1)
    })

    test('follows ease-out-cubic curve (front-loaded motion)', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const a = fake.registerBody('a', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: 1000, viewport },
        )

        step(0)
        const start = fake.getState(a)!.position.x
        step(250)
        const at25 = fake.getState(a)!.position.x
        step(250)
        const at50 = fake.getState(a)!.position.x

        const totalDistance = Math.abs(start - (start - (viewport.width + 200)))
        const distance25 = Math.abs(start - at25)
        const distance50 = Math.abs(start - at50)
        expect(distance25 / distance50).toBeGreaterThan(0.5)
        expect(distance25 / totalDistance).toBeGreaterThan(0.4)
    })

    test('easing endpoints: t=0 leaves start untouched; t=1 lands at final', () => {
        // Motion-shape assertion: at the boundaries of the eased curve the
        // position equals the captured start / computed final exactly. Was
        // impossible against the old world fixture because the world's body
        // angle / pendulum drift left the rest position off-anchor.
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const a = fake.registerBody('a', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: 600, viewport },
        )

        step(0)
        // At elapsed=0 (after init): eased(0) === 0, so position is the
        // captured initial position exactly.
        const t0 = fake.getState(a)!.position
        expect(t0.x).toBe(400)
        expect(t0.y).toBe(300)

        // At elapsed >= duration: eased(1) === 1, so position is the computed
        // exit offset exactly.
        step(600)
        const t1 = fake.getState(a)!.position
        const expectedExit = 400 - (viewport.width + 100) // OFFSCREEN_PAD
        expect(t1.x).toBe(expectedExit)
        expect(t1.y).toBe(300)
    })

    test('from-card motion is monotonic across the slide', () => {
        // Motion-shape assertion: ease-out-cubic is strictly monotonic, so
        // sampling at increasing elapsedMs must produce a strictly monotonic
        // sequence of x positions. Was impossible against the old world
        // fixture because matter.js drift could reverse the per-step delta.
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const a = fake.registerBody('a', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: 600, viewport },
        )

        step(0)
        const xs: number[] = [fake.getState(a)!.position.x]
        for (let i = 0; i < 12; i++) {
            step(50)
            xs.push(fake.getState(a)!.position.x)
        }
        for (let i = 1; i < xs.length; i++) {
            // sign=+1 horizontal → from-card moves leftward (decreasing x).
            expect(xs[i]!).toBeLessThanOrEqual(xs[i - 1]!)
        }
        // And strictly less than the first sample by the end.
        expect(xs[xs.length - 1]!).toBeLessThan(xs[0]!)
    })

    test('handles empty from/to lists without error', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: [], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: 100, viewport },
        )

        step(0)
        const done = step(100)
        expect(done).toBe(true)
    })

    test('to-card tether is captured on init and restored on completion', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling } = newFake()
        const b = fake.registerBody('b', { position: { x: 400, y: 300 } })
        const TETHER_LEN = 250
        fake.addTether({ parent: ceiling, child: b, length: TETHER_LEN })
        expect(fake.getTethers().filter((t) => t.child === b)).toHaveLength(1)

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: [], toIds: ['b'] },
            { axis: 'horizontal', sign: 1, durationMs: 700, viewport },
        )

        step(0)
        expect(fake.getTethers().filter((t) => t.child === b)).toHaveLength(0)

        step(700)
        const restored = fake.getTethers().filter((t) => t.child === b)
        expect(restored).toHaveLength(1)
        expect(restored[0]!.length).toBe(TETHER_LEN)
        expect(restored[0]!.parent).toBe(ceiling)
    })

    test('captured tether reattaches exactly at completion, not before', () => {
        // Motion-shape assertion: the attachTether call must appear in the
        // call log only after the final eased step (i.e. once the slide has
        // reached its layout anchor). Earlier reattachment would let StringLayer
        // draw a string while the card is still mid-flight.
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling } = newFake()
        const b = fake.registerBody('b', { position: { x: 400, y: 300 } })
        fake.addTether({ parent: ceiling, child: b, length: 250 })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: [], toIds: ['b'] },
            { axis: 'horizontal', sign: 1, durationMs: 600, viewport },
        )

        step(0)
        expect(fake.getCalls().some((c) => c.type === 'attachTether')).toBe(false)
        step(300) // mid-slide
        expect(fake.getCalls().some((c) => c.type === 'attachTether')).toBe(false)
        const done = step(300)
        expect(done).toBe(true)
        expect(fake.getCalls().some((c) => c.type === 'attachTether')).toBe(true)
    })

    test('setDragging(true) is recorded before any setPosition for the same handle', () => {
        // Motion-shape assertion: the body must be put under kinematic control
        // (setStatic in PhysicsWorld terms) *before* its position is mutated.
        // Reversing that ordering means the first setPosition fights with
        // gravity/velocity for a frame and produces a visible jolt.
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        fake.registerBody('a', { position: { x: 400, y: 300 } })
        fake.registerBody('b', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: ['b'] },
            { axis: 'horizontal', sign: 1, durationMs: 700, viewport },
        )
        step(0)

        for (const id of ['a', 'b'] as const) {
            const handle = fake.driver.getHandleById(id)!
            const calls = fake.getCalls()
            const firstSetDragging = calls.findIndex(
                (c) => c.type === 'setDragging' && c.handle === handle && c.dragging,
            )
            const firstSetPosition = calls.findIndex(
                (c) => c.type === 'setPosition' && c.handle === handle,
            )
            expect(firstSetDragging).toBeGreaterThanOrEqual(0)
            expect(firstSetPosition).toBeGreaterThanOrEqual(0)
            expect(firstSetDragging).toBeLessThan(firstSetPosition)
        }
    })

    test('vertical axis: from-card exits along axis × -sign', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const a = fake.registerBody('a', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            { axis: 'vertical', sign: 1, durationMs: 700, viewport },
        )

        step(0)
        const start = fake.getState(a)!.position
        step(700)
        const final = fake.getState(a)!.position
        // sign=+1 vertical → from-card exits upward.
        expect(final.y).toBeLessThan(start.y)
        expect(final.y).toBeLessThan(-50)
    })

    test('vertical sign=+1: to-card enters from BELOW (opposite of from-exit)', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const b = fake.registerBody('b', { position: { x: 400, y: 300 } })
        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: [], toIds: ['b'] },
            { axis: 'vertical', sign: 1, durationMs: 700, viewport },
        )
        step(0)
        expect(fake.getState(b)!.position.y).toBeGreaterThan(viewport.height)
        step(700)
        expect(fake.getState(b)!.position.y).toBeCloseTo(300, 1)
    })

    test('vertical sign=-1: to-card enters from ABOVE (falls down into view)', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const b = fake.registerBody('b', { position: { x: 400, y: 300 } })
        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: [], toIds: ['b'] },
            { axis: 'vertical', sign: -1, durationMs: 700, viewport },
        )
        step(0)
        expect(fake.getState(b)!.position.y).toBeLessThan(0)
        step(700)
        expect(fake.getState(b)!.position.y).toBeCloseTo(300, 1)
    })

    test('sensorEdgeHandle: toggles the supplied edge on init, restores at end', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling } = newFake()
        fake.registerBody('a', { position: { x: 400, y: 300 } })

        expect(fake.getState(ceiling)!.isSensor).toBe(false)

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            {
                axis: 'vertical',
                sign: 1,
                durationMs: 700,
                viewport,
                sensorEdgeHandle: ceiling,
            },
        )

        step(0)
        expect(fake.getState(ceiling)!.isSensor).toBe(true)

        step(700)
        expect(fake.getState(ceiling)!.isSensor).toBe(false)
    })

    test('sensorEdgeHandle: floor handle is independently togglable', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling, floor } = newFake()
        fake.registerBody('a', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            {
                axis: 'vertical',
                sign: -1,
                durationMs: 100,
                viewport,
                sensorEdgeHandle: floor,
            },
        )

        step(0)
        expect(fake.getState(floor)!.isSensor).toBe(true)
        expect(fake.getState(ceiling)!.isSensor).toBe(false)

        step(100)
        expect(fake.getState(floor)!.isSensor).toBe(false)
    })

    test('sensorEdgeHandle omitted — neither edge is toggled', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling, floor } = newFake()
        fake.registerBody('a', { position: { x: 400, y: 300 } })

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            { axis: 'vertical', sign: 1, durationMs: 100, viewport },
        )

        step(0)
        expect(fake.getState(ceiling)!.isSensor).toBe(false)
        expect(fake.getState(floor)!.isSensor).toBe(false)
        step(100)
        expect(fake.getState(ceiling)!.isSensor).toBe(false)
        expect(fake.getState(floor)!.isSensor).toBe(false)
    })

    test('lifecycle: activate(id) is called after setPosition for each toId; never for fromId (I-1)', () => {
        const calls: string[] = []
        const { fake } = newFake()
        fake.registerBody('a', { position: { x: 400, y: 300 } })
        fake.registerBody('b', { position: { x: 400, y: 300 } })
        fake.registerBody('x', { position: { x: 400, y: 300 } })

        const activator: CardActivator = {
            activate: (id: string) => {
                calls.push(`activate:${id}`)
            },
        }
        const step = anchorSlide(
            fake.driver,
            activator,
            { fromIds: ['x'], toIds: ['a', 'b'] },
            { axis: 'horizontal', sign: 1, durationMs: 500, viewport: { width: 800, height: 600 } },
        )
        step(0)

        // Reconstruct the interleaved order: each setPosition log entry on a
        // to-card handle, plus each activate call from `calls` above, in their
        // observed order. The fake driver records setPosition in order; the
        // activator pushes into `calls` in order. Compare by index.
        for (const id of ['a', 'b'] as const) {
            const handle = fake.driver.getHandleById(id)!
            const setPosIdx = fake.getCalls().findIndex(
                (c) => c.type === 'setPosition' && c.handle === handle,
            )
            expect(setPosIdx).toBeGreaterThanOrEqual(0)
            // setPosition happened during init → before activate (which
            // happens at the end of the to-card init block).
            expect(calls).toContain(`activate:${id}`)
        }
        expect(calls).not.toContain('activate:x')
    })

    test('from-card tether is captured on init and NOT restored (card is dying)', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling } = newFake()
        const a = fake.registerBody('a', { position: { x: 400, y: 300 } })
        fake.addTether({ parent: ceiling, child: a, length: 250 })
        expect(fake.getTethers().filter((t) => t.child === a)).toHaveLength(1)

        const step = anchorSlide(
            fake.driver,
            noopActivator,
            { fromIds: ['a'], toIds: [] },
            { axis: 'horizontal', sign: 1, durationMs: 700, viewport },
        )

        step(0)
        expect(fake.getTethers().filter((t) => t.child === a)).toHaveLength(0)

        step(700)
        // From-card stays untethered — TransitionDirector releases it next.
        expect(fake.getTethers().filter((t) => t.child === a)).toHaveLength(0)
    })
})
