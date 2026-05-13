import { describe, test, expect } from 'vitest'
import { TETHER_STIFFNESS, Tether } from './Tether'
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
        expect(f.y).toBeCloseTo(-100 * TETHER_STIFFNESS * 5, 10)
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
        expect(f.y).toBeCloseTo(-50 * TETHER_STIFFNESS * 5, 10)
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
})
