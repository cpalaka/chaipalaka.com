import { describe, test, expect } from 'vitest'
import { Tether, resolveParent, wireTetherFor } from './Tether'
import { physicsTuning } from './physicsTuning'
import { PhysicsWorld } from './PhysicsWorld'
import type { BodyForceSource } from './BodyForceSource'
import type { PhysicsHandle, Vec2 } from './PhysicsWorld'

class FakeBodyForceSource implements BodyForceSource {
    private bodies = new Map<
        PhysicsHandle,
        { pos: Vec2; mass: number; isStatic: boolean }
    >()
    forces: Array<{ h: PhysicsHandle; force: Vec2 }> = []

    setBody(h: PhysicsHandle, pos: Vec2, mass: number, isStatic = false) {
        this.bodies.set(h, { pos: { ...pos }, mass, isStatic })
    }
    setPosition(h: PhysicsHandle, pos: Vec2) {
        const b = this.bodies.get(h)
        if (b) b.pos = { ...pos }
    }
    getPosition(h: PhysicsHandle): Vec2 {
        const b = this.bodies.get(h)
        if (!b) throw new Error(`FakeBodyForceSource: unknown handle ${h}`)
        return { ...b.pos }
    }
    getMass(h: PhysicsHandle): number {
        const b = this.bodies.get(h)
        if (!b) throw new Error(`FakeBodyForceSource: unknown handle ${h}`)
        return b.mass
    }
    isStatic(h: PhysicsHandle): boolean {
        const b = this.bodies.get(h)
        if (!b) throw new Error(`FakeBodyForceSource: unknown handle ${h}`)
        return b.isStatic
    }
    applyForce(h: PhysicsHandle, force: Vec2): void {
        this.forces.push({ h, force: { ...force } })
    }

    totalForceOn(h: PhysicsHandle): Vec2 {
        let x = 0
        let y = 0
        for (const f of this.forces) {
            if (f.h !== h) continue
            x += f.force.x
            y += f.force.y
        }
        return { x, y }
    }
}

describe('Tether add/remove', () => {
    test('add returns a numeric handle', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        const h = tether.add(1, 2, 100)
        expect(typeof h).toBe('number')
    })

    test('remove deletes the tether from records', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        const h = tether.add(1, 2, 100)
        expect(tether.records()).toHaveLength(1)
        tether.remove(h)
        expect(tether.records()).toHaveLength(0)
    })

    test('remove of an unknown handle is a no-op', () => {
        const src = new FakeBodyForceSource()
        const tether = new Tether(src)
        expect(() => tether.remove(999)).not.toThrow()
    })
})

describe('Tether setLength', () => {
    test('mutates the rest length used by applyRopeForces', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 200 }, 5)
        const tether = new Tether(src)
        const h = tether.add(1, 2, 200) // taut at exactly length → no force
        tether.applyRopeForces()
        expect(src.forces).toHaveLength(0)

        tether.setLength(h, 100) // shorten → overshoot 100 → pull-only force
        tether.applyRopeForces()
        const f = src.totalForceOn(2)
        expect(f.y).toBeCloseTo(-100 * physicsTuning.tetherStiffness * 5, 10)
    })

    test('setLength of an unknown handle is a no-op', () => {
        const src = new FakeBodyForceSource()
        const tether = new Tether(src)
        expect(() => tether.setLength(999, 50)).not.toThrow()
    })

    test('setLength does NOT notify structural subscribers (per-frame ease is off the React path)', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 200 }, 5)
        const tether = new Tether(src)
        const h = tether.add(1, 2, 200)
        let fired = 0
        tether.subscribeChange(() => {
            fired++
        })
        tether.setLength(h, 100)
        expect(fired).toBe(0)
    })
})

describe('Tether subscribeChange', () => {
    test('callback fires on add', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        let fired = 0
        tether.subscribeChange(() => {
            fired++
        })
        tether.add(1, 2, 100)
        expect(fired).toBe(1)
    })

    test('callback fires on remove', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        const h = tether.add(1, 2, 100)
        let fired = 0
        tether.subscribeChange(() => {
            fired++
        })
        tether.remove(h)
        expect(fired).toBe(1)
    })

    test('unsubscribe stops further callbacks', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        let fired = 0
        const unsub = tether.subscribeChange(() => {
            fired++
        })
        unsub()
        tether.add(1, 2, 100)
        expect(fired).toBe(0)
    })
})

describe('Tether records()', () => {
    test('returns a stable reference until the set changes', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        const r1 = tether.records()
        const r2 = tether.records()
        expect(r2).toBe(r1)
        tether.add(1, 2, 100)
        const r3 = tether.records()
        expect(r3).not.toBe(r1)
        const r4 = tether.records()
        expect(r4).toBe(r3)
    })

    test('returns a new reference after remove', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        const h = tether.add(1, 2, 100)
        const r1 = tether.records()
        tether.remove(h)
        const r2 = tether.records()
        expect(r2).not.toBe(r1)
        expect(r2).toHaveLength(0)
    })

    test('record contents include handle, parent, child, length, anchorA', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 50, y: 100 }, 1)
        const tether = new Tether(src)
        const h = tether.add(1, 2, 100, { x: 50, y: 0 })
        const rec = tether.records()[0]!
        expect(rec.handle).toBe(h)
        expect(rec.parent).toBe(1)
        expect(rec.child).toBe(2)
        expect(rec.length).toBe(100)
        expect(rec.anchorA).toEqual({ x: 50, y: 0 })
    })

    test('record omits anchorA when not provided', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        const rec = tether.records()[0]!
        expect(rec.anchorA).toBeUndefined()
    })
})

describe('Tether list()', () => {
    test('parentPos and childPos are read live from BodyForceSource', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        const v1 = tether.list()[0]!
        expect(v1.parentPos).toEqual({ x: 0, y: 0 })
        expect(v1.childPos).toEqual({ x: 0, y: 100 })
        src.setPosition(2, { x: 0, y: 150 })
        const v2 = tether.list()[0]!
        expect(v2.childPos).toEqual({ x: 0, y: 150 })
    })

    test('parentPos = parentBodyPos + anchorA when anchorA is provided', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 400, y: -30 }, 1, true)
        src.setBody(2, { x: 200, y: 100 }, 1)
        const tether = new Tether(src)
        tether.add(1, 2, 150, { x: -200, y: 30 })
        const v = tether.list()[0]!
        expect(v.parentPos.x).toBeCloseTo(200, 5)
        expect(v.parentPos.y).toBeCloseTo(0, 5)
    })

    test('slack is true when distance < length * 0.98', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 50 }, 1)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        expect(tether.list()[0]!.slack).toBe(true)
    })

    test('slack is false when distance >= length * 0.98', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 99 }, 1)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        expect(tether.list()[0]!.slack).toBe(false)
    })
})

describe('Tether applyRopeForces', () => {
    test('applies no force when child is within tether length (slack)', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 50 }, 1)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        tether.applyRopeForces()
        expect(src.forces).toHaveLength(0)
    })

    test('applies no force when distance exactly equals length', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 1)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        tether.applyRopeForces()
        expect(src.forces).toHaveLength(0)
    })

    test('applies pull-only force when child is past tether length', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 200 }, 5)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        tether.applyRopeForces()
        const f = src.totalForceOn(2)
        expect(f.x).toBeCloseTo(0, 10)
        expect(f.y).toBeCloseTo(-100 * physicsTuning.tetherStiffness * 5, 10)
    })

    test('force direction: child pulled toward parent, parent pulled toward child', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 2)
        src.setBody(2, { x: 0, y: 150 }, 5)
        const tether = new Tether(src)
        tether.add(1, 2, 50)
        tether.applyRopeForces()
        const fc = src.totalForceOn(2)
        const fp = src.totalForceOn(1)
        expect(fc.y).toBeLessThan(0)
        expect(fp.y).toBeGreaterThan(0)
    })

    test('does not apply force to a static parent', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 200 }, 5)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        tether.applyRopeForces()
        const fp = src.totalForceOn(1)
        expect(fp.x).toBe(0)
        expect(fp.y).toBe(0)
    })

    test('does not apply force to a static child', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1)
        src.setBody(2, { x: 0, y: 200 }, 5, true)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        tether.applyRopeForces()
        const fc = src.totalForceOn(2)
        expect(fc.x).toBe(0)
        expect(fc.y).toBe(0)
    })

    test('anchorA shifts the rope origin to parentBodyPos + anchorA', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 400, y: -30 }, 1, true)
        src.setBody(2, { x: 200, y: 150 }, 5)
        const tether = new Tether(src)
        tether.add(1, 2, 100, { x: -200, y: 30 })
        tether.applyRopeForces()
        const f = src.totalForceOn(2)
        expect(f.x).toBeCloseTo(0, 10)
        expect(f.y).toBeCloseTo(-50 * physicsTuning.tetherStiffness * 5, 10)
    })

    test('multiple tethers apply independently', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 200 }, 5)
        src.setBody(3, { x: 100, y: 0 }, 1, true)
        src.setBody(4, { x: 100, y: 200 }, 5)
        const tether = new Tether(src)
        tether.add(1, 2, 100)
        tether.add(3, 4, 50)
        tether.applyRopeForces()
        expect(src.totalForceOn(2).y).toBeLessThan(0)
        expect(src.totalForceOn(4).y).toBeLessThan(0)
    })

    test('removeReferencing drops every record where the body appears as parent or child', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 5)
        src.setBody(3, { x: 0, y: 200 }, 5)
        src.setBody(4, { x: 0, y: 300 }, 5)
        const tether = new Tether(src)
        tether.add(1, 2, 80) // ceiling → 2
        tether.add(2, 3, 80) // 2 → 3 (body 2 is the parent)
        tether.add(3, 4, 80) // 3 → 4 (unaffected by removing body 2)
        expect(tether.records()).toHaveLength(3)

        const removed = tether.removeReferencing(2)
        expect(removed).toBe(2)
        const remaining = tether.records()
        expect(remaining).toHaveLength(1)
        expect(remaining[0]?.parent).toBe(3)
        expect(remaining[0]?.child).toBe(4)
    })

    test('removeReferencing is a no-op when the body appears in no record', () => {
        const src = new FakeBodyForceSource()
        src.setBody(1, { x: 0, y: 0 }, 1, true)
        src.setBody(2, { x: 0, y: 100 }, 5)
        const tether = new Tether(src)
        tether.add(1, 2, 80)
        expect(tether.removeReferencing(99)).toBe(0)
        expect(tether.records()).toHaveLength(1)
    })
})

describe('resolveParent', () => {
    function makeWorldStub(opts: {
        ceilingHandle: PhysicsHandle
        floorHandle: PhysicsHandle
        registered: ReadonlyMap<string, PhysicsHandle>
        contentBoxTopHandle?: PhysicsHandle
        contentBoxBottomHandle?: PhysicsHandle
    }): PhysicsWorld {
        return {
            ceilingHandle: opts.ceilingHandle,
            floorHandle: opts.floorHandle,
            contentBoxTopHandle: opts.contentBoxTopHandle,
            contentBoxBottomHandle: opts.contentBoxBottomHandle,
            getHandleById: (id: string) => opts.registered.get(id),
        } as unknown as PhysicsWorld
    }

    test("'ceiling' resolves to world.ceilingHandle with kind 'ceiling'", () => {
        const world = makeWorldStub({
            ceilingHandle: 7,
            floorHandle: 8,
            registered: new Map(),
        })
        expect(resolveParent(world, 'ceiling')).toEqual({
            handle: 7,
            kind: 'ceiling',
        })
    })

    test("'floor' resolves to world.floorHandle with kind 'floor'", () => {
        const world = makeWorldStub({
            ceilingHandle: 7,
            floorHandle: 8,
            registered: new Map(),
        })
        expect(resolveParent(world, 'floor')).toEqual({
            handle: 8,
            kind: 'floor',
        })
    })

    test('registered card-id resolves to its handle with kind \'card\'', () => {
        const world = makeWorldStub({
            ceilingHandle: 7,
            floorHandle: 8,
            registered: new Map([['card-a', 42]]),
        })
        expect(resolveParent(world, 'card-a')).toEqual({
            handle: 42,
            kind: 'card',
        })
    })

    test('missing card-id resolves to null', () => {
        const world = makeWorldStub({
            ceilingHandle: 7,
            floorHandle: 8,
            registered: new Map(),
        })
        expect(resolveParent(world, 'never-registered')).toBeNull()
    })

    test("'box-top' resolves to world.contentBoxTopHandle with kind 'ceiling'", () => {
        const world = makeWorldStub({
            ceilingHandle: 7,
            floorHandle: 8,
            registered: new Map(),
            contentBoxTopHandle: 11,
            contentBoxBottomHandle: 12,
        })
        expect(resolveParent(world, 'box-top')).toEqual({
            handle: 11,
            kind: 'ceiling',
        })
    })

    test("'box-bottom' resolves to world.contentBoxBottomHandle with kind 'floor'", () => {
        const world = makeWorldStub({
            ceilingHandle: 7,
            floorHandle: 8,
            registered: new Map(),
            contentBoxTopHandle: 11,
            contentBoxBottomHandle: 12,
        })
        expect(resolveParent(world, 'box-bottom')).toEqual({
            handle: 12,
            kind: 'floor',
        })
    })

    test("'box-bottom' resolves to null when no content box is registered", () => {
        const world = makeWorldStub({
            ceilingHandle: 7,
            floorHandle: 8,
            registered: new Map(),
        })
        expect(resolveParent(world, 'box-bottom')).toBeNull()
    })
})

describe('wireTetherFor — radial edge wiring (spec §3.3)', () => {
    // Content box top edge: line at y=300, spans x∈[200,800], body centre (500,330).
    const makeBoxWorld = () => {
        const w = new PhysicsWorld({ viewport: { width: 2000, height: 2000 } })
        w.setContentBox({ x: 200, y: 300, width: 600, height: 400 })
        return w
    }
    const attachWorld = (w: PhysicsWorld, parent: PhysicsHandle, anchorA: Vec2) => {
        const p = w.getPosition(parent)
        return { x: p.x + anchorA.x, y: p.y + anchorA.y }
    }

    test('within-width child: attach = nearest edge point, radial length', () => {
        const w = makeBoxWorld()
        const top = w.contentBoxTopHandle!
        const child = w.registerById('c', { x: 450, y: 600 }, { width: 100, height: 60 })
        const th = wireTetherFor(w, top, 'ceiling', child, { x: 450, y: 600 })
        const rec = w.tether.records().find((r) => r.handle === th)!
        const attach = attachWorld(w, top, rec.anchorA!)
        expect(attach.x).toBeCloseTo(450, 6) // directly above the child
        expect(attach.y).toBeCloseTo(300, 6) // on the edge line
        expect(rec.length).toBeCloseTo(300, 6) // hypot(0, 600-300)
    })

    test('out-of-width child: attach clamps to the edge, length is radial (not y-projection)', () => {
        const w = makeBoxWorld()
        const top = w.contentBoxTopHandle!
        // child to the right of the box (x=1000 > 800)
        const child = w.registerById('c', { x: 1000, y: 600 }, { width: 100, height: 60 })
        const th = wireTetherFor(w, top, 'ceiling', child, { x: 1000, y: 600 })
        const rec = w.tether.records().find((r) => r.handle === th)!
        const attach = attachWorld(w, top, rec.anchorA!)
        expect(attach.x).toBeCloseTo(800, 6) // clamped to the bar's right end
        expect(attach.y).toBeCloseTo(300, 6)
        expect(rec.length).toBeCloseTo(Math.hypot(200, 300), 4) // radial ≈ 360.6
        expect(rec.length).toBeGreaterThan(301) // NOT the y-projection (300)
    })
})
