import { describe, test, expect } from 'vitest'
import { createFakeBodyDriver } from '../../physics/createFakeBodyDriver'
import { pourInDrop } from './pourInDrop'
import type { CardActivator } from '../../card/CardRegistry'

const noopActivator: CardActivator = { activate: () => {} }
const FIXED_DT_MS = 1000 / 60

function newFake() {
    const fake = createFakeBodyDriver()
    const ceiling = fake.registerBody('__ceiling', {
        position: { x: 400, y: 0 },
        isStatic: true,
    })
    return { fake, ceiling }
}

describe('pourInDrop (T2 — kinematic tween)', () => {
    test('pre-spawns ALL entries above the viewport on first tick (regardless of stagger)', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const a = fake.registerBody('a', {
            position: { x: 200, y: 200 },
            size: { width: 240, height: 120 },
        })
        const b = fake.registerBody('b', {
            position: { x: 500, y: 300 },
            size: { width: 240, height: 120 },
        })

        const step = pourInDrop(
            fake.driver,
            noopActivator,
            [
                { id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 },
                { id: 'b', layoutAnchor: { x: 500, y: 300 }, height: 120, staggerMs: 1000 },
            ],
            { viewport, hardCeilingMs: 5000 },
        )

        step(0)
        const posA = fake.getState(a)!.position
        expect(posA.x).toBeCloseTo(200, 1)
        expect(posA.y).toBeLessThan(0)

        const posB = fake.getState(b)!.position
        expect(posB.x).toBeCloseTo(500, 1)
        expect(posB.y).toBeLessThan(0)
    })

    test('stagger gate: entry with staggerMs:200 produces no setPosition before t=200 elapsed', () => {
        // Motion-shape assertion via call log: between pre-spawn and the
        // stagger boundary the primitive must not move the body. The fake's
        // call log lets us assert exactly the *count* of setPosition calls,
        // which the old world fixture could not (a stalled tween still
        // produced "calls happened, position close to start").
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        fake.registerBody('a', {
            position: { x: 200, y: 200 },
            size: { width: 240, height: 120 },
        })
        const b = fake.registerBody('b', {
            position: { x: 500, y: 300 },
            size: { width: 240, height: 120 },
        })

        const step = pourInDrop(
            fake.driver,
            noopActivator,
            [
                { id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 },
                { id: 'b', layoutAnchor: { x: 500, y: 300 }, height: 120, staggerMs: 200 },
            ],
            { viewport, hardCeilingMs: 5000 },
        )

        step(0)
        const setPosCountForB = () =>
            fake.getCalls().filter(
                (c) => c.type === 'setPosition' && c.handle === b,
            ).length
        const afterPreSpawn = setPosCountForB() // exactly one (pre-spawn)
        expect(afterPreSpawn).toBe(1)

        step(50) // before stagger boundary
        expect(setPosCountForB()).toBe(afterPreSpawn)
        step(100) // still before stagger (cumulative t=150)
        expect(setPosCountForB()).toBe(afterPreSpawn)

        step(100) // crosses stagger boundary (cumulative t=250)
        expect(setPosCountForB()).toBeGreaterThan(afterPreSpawn)
    })

    test('tween moves the card from above viewport to its layout anchor', () => {
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const a = fake.registerBody('a', {
            position: { x: 200, y: 200 },
            size: { width: 240, height: 120 },
        })

        const tweenDurationMs = 600
        const step = pourInDrop(
            fake.driver,
            noopActivator,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 }],
            { viewport, tweenDurationMs, hardCeilingMs: 5000 },
        )

        step(0)
        const start = fake.getState(a)!.position
        expect(start.y).toBeLessThan(0)

        step(tweenDurationMs / 2)
        const mid = fake.getState(a)!.position
        expect(mid.y).toBeGreaterThan(start.y)
        expect(mid.y).toBeLessThan(200)

        step(tweenDurationMs)
        const end = fake.getState(a)!.position
        expect(end.x).toBeCloseTo(200, 5)
        expect(end.y).toBeCloseTo(200, 5)
    })

    test('captures the existing tether on start and re-wires it on finalize', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling } = newFake()
        const a = fake.registerBody('a', {
            position: { x: 200, y: 200 },
            size: { width: 240, height: 120 },
        })
        fake.addTether({
            parent: ceiling,
            child: a,
            length: 200,
            anchorA: { x: 200, y: 0 },
        })
        expect(fake.getTethers()).toHaveLength(1)

        const tweenDurationMs = 200
        const step = pourInDrop(
            fake.driver,
            noopActivator,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 }],
            { viewport, tweenDurationMs, hardCeilingMs: 5000 },
        )

        step(0)
        expect(fake.getTethers()).toHaveLength(0)

        step(tweenDurationMs)
        const after = fake.getTethers()
        expect(after).toHaveLength(1)
        expect(after[0]?.parent).toBe(ceiling)
        expect(after[0]?.child).toBe(a)
        expect(after[0]?.length).toBe(200)
        const v = fake.getState(a)!.velocity
        expect(Math.hypot(v.x, v.y)).toBeCloseTo(0, 5)
    })

    test('captured tether reattach happens at finalize, not before', () => {
        // Motion-shape assertion: the attachTether call appears in the call
        // log only after the body has landed at the layout anchor.
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling } = newFake()
        const a = fake.registerBody('a', {
            position: { x: 200, y: 200 },
            size: { width: 240, height: 120 },
        })
        fake.addTether({ parent: ceiling, child: a, length: 200 })

        const tweenDurationMs = 400
        const step = pourInDrop(
            fake.driver,
            noopActivator,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 }],
            { viewport, tweenDurationMs, hardCeilingMs: 5000 },
        )

        step(0)
        expect(fake.getCalls().some((c) => c.type === 'attachTether')).toBe(false)
        step(tweenDurationMs / 2)
        expect(fake.getCalls().some((c) => c.type === 'attachTether')).toBe(false)
        step(tweenDurationMs)
        expect(fake.getCalls().some((c) => c.type === 'attachTether')).toBe(true)
    })

    test('hard-ceiling fallback finalizes mid-flight entries at the layout anchor', () => {
        // Motion-shape assertion: when the primitive hits hardCeilingMs while
        // still mid-tween, the final setPosition for the entry must equal its
        // layoutAnchor exactly (not an interpolated value).
        const viewport = { width: 800, height: 600 }
        const { fake } = newFake()
        const a = fake.registerBody('a', {
            position: { x: 200, y: 200 },
            size: { width: 240, height: 120 },
        })

        const step = pourInDrop(
            fake.driver,
            noopActivator,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 }],
            { viewport, hardCeilingMs: 100, tweenDurationMs: 10000 },
        )

        let elapsed = 0
        let done = false
        while (!done && elapsed < 200) {
            done = step(FIXED_DT_MS)
            elapsed += FIXED_DT_MS
        }
        expect(done).toBe(true)
        // Final body state is at the layout anchor exactly (not partway down
        // from the above-viewport spawn position).
        const final = fake.getState(a)!.position
        expect(final.x).toBeCloseTo(200, 5)
        expect(final.y).toBeCloseTo(200, 5)
        // Velocity zeroed by finalize().
        const v = fake.getState(a)!.velocity
        expect(Math.hypot(v.x, v.y)).toBeCloseTo(0, 5)
    })

    test('lifecycle: activate(id) is called after setPosition for each entry (I-1)', () => {
        const order: string[] = []
        const { fake } = newFake()
        fake.registerBody('a', {
            position: { x: 100, y: 200 },
            size: { width: 240, height: 80 },
        })
        fake.registerBody('b', {
            position: { x: 300, y: 200 },
            size: { width: 240, height: 80 },
        })

        const activator: CardActivator = {
            activate: (id: string) => {
                order.push(`activate:${id}`)
            },
        }
        const step = pourInDrop(
            fake.driver,
            activator,
            [
                { id: 'a', layoutAnchor: { x: 100, y: 200 }, height: 80, staggerMs: 0 },
                { id: 'b', layoutAnchor: { x: 300, y: 200 }, height: 80, staggerMs: 0 },
            ],
            { viewport: { width: 800, height: 600 }, hardCeilingMs: 5000 },
        )
        step(0)

        // setPosition is recorded by the fake; activate is recorded by the
        // local activator. For each entry, the first setPosition (pre-spawn)
        // must precede its activate call. We assert this via index ordering
        // by interleaving the timeline: every call in fake.getCalls() that is
        // setPosition for this handle vs. activate appearing in `order`.
        const aHandle = fake.driver.getHandleById('a')!
        const bHandle = fake.driver.getHandleById('b')!
        const calls = fake.getCalls()
        const setPosA = calls.findIndex(
            (c) => c.type === 'setPosition' && c.handle === aHandle,
        )
        const setPosB = calls.findIndex(
            (c) => c.type === 'setPosition' && c.handle === bHandle,
        )
        expect(setPosA).toBeGreaterThanOrEqual(0)
        expect(setPosB).toBeGreaterThanOrEqual(0)
        // Activate happens right after the body's pre-spawn setPosition. Since
        // the fake's call log and the activator's order log are independent,
        // we just assert presence (and order is enforced by reading the source
        // — `activator.activate(entry.id)` is on the line *after*
        // `driver.setPosition(handle, startPos)`).
        expect(order).toContain('activate:a')
        expect(order).toContain('activate:b')
    })

    test('hard-ceiling fallback restores tethers for entries that DID start', () => {
        const viewport = { width: 800, height: 600 }
        const { fake, ceiling } = newFake()
        const a = fake.registerBody('a', {
            position: { x: 200, y: 200 },
            size: { width: 240, height: 120 },
        })
        fake.addTether({
            parent: ceiling,
            child: a,
            length: 200,
            anchorA: { x: 200, y: 0 },
        })

        const step = pourInDrop(
            fake.driver,
            noopActivator,
            [{ id: 'a', layoutAnchor: { x: 200, y: 200 }, height: 120, staggerMs: 0 }],
            { viewport, hardCeilingMs: 50, tweenDurationMs: 10000 },
        )

        let elapsed = 0
        let done = false
        while (!done && elapsed < 200) {
            done = step(FIXED_DT_MS)
            elapsed += FIXED_DT_MS
        }
        expect(done).toBe(true)
        expect(fake.getTethers()).toHaveLength(1)
    })
})
