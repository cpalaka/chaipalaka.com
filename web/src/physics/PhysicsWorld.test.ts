import { describe, test, expect } from 'vitest'
import { PhysicsWorld } from './PhysicsWorld'

const FIXED_DT_MS = 1000 / 60

describe('PhysicsWorld registration', () => {
  test('register returns a handle that can be unregistered', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 100, y: 100 },
      { width: 200, height: 80 },
    )
    expect(handle).toBeDefined()
    expect(world.has(handle)).toBe(true)
    world.unregister(handle)
    expect(world.has(handle)).toBe(false)
  })
})

describe('PhysicsWorld dynamics', () => {
  test('a freshly registered body sits exactly at its anchor', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 250, y: 175 },
      { width: 100, height: 50 },
    )
    const pos = world.getPosition(handle)
    expect(pos.x).toBeCloseTo(250, 5)
    expect(pos.y).toBeCloseTo(175, 5)
  })

  test('applyImpulse moves the body in the impulse direction on the next tick', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 100, y: 100 },
      { width: 100, height: 50 },
    )
    world.applyImpulse(handle, { x: 5, y: 0 })
    world.tick(FIXED_DT_MS)
    const pos = world.getPosition(handle)
    expect(pos.x).toBeGreaterThan(100)
    expect(Math.abs(pos.y - 100)).toBeLessThan(1)
  })

  test('after an impulse, the breathing-mode spring returns the body to its anchor', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 200, y: 200 },
      { width: 100, height: 50 },
    )
    world.applyImpulse(handle, { x: 50, y: 0 })
    for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
    const pos = world.getPosition(handle)
    expect(Math.abs(pos.x - 200)).toBeLessThan(1)
    expect(Math.abs(pos.y - 200)).toBeLessThan(1)
  })
})

describe('PhysicsWorld gravity', () => {
  test('setGravity(true) lets a card fall; setGravity(false) springs it back', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 100, y: 100 },
      { width: 100, height: 50 },
    )

    world.setGravity(true)
    for (let i = 0; i < 30; i++) world.tick(FIXED_DT_MS)
    const fellTo = world.getPosition(handle)
    expect(fellTo.y).toBeGreaterThan(100)

    world.setGravity(false)
    for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
    const restored = world.getPosition(handle)
    expect(Math.abs(restored.x - 100)).toBeLessThan(1)
    expect(Math.abs(restored.y - 100)).toBeLessThan(1)
  })

  test('with gravity on, the floor body catches a falling card (no escape)', () => {
    const viewport = { width: 800, height: 400 }
    const world = new PhysicsWorld({ viewport })
    const handle = world.register({ x: 100, y: 50 }, { width: 100, height: 50 })

    world.setGravity(true)
    for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)

    const pos = world.getPosition(handle)
    expect(pos.y).toBeLessThanOrEqual(viewport.height)
  })
})

describe('PhysicsWorld drag handles', () => {
  test('setPosition moves the body to the target coordinates immediately', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 100, y: 100 },
      { width: 100, height: 50 },
    )
    world.applyImpulse(handle, { x: 20, y: 0 })
    world.setPosition(handle, { x: 300, y: 250 })
    const pos = world.getPosition(handle)
    expect(pos.x).toBeCloseTo(300, 5)
    expect(pos.y).toBeCloseTo(250, 5)
  })
})

describe('PhysicsWorld transform callback', () => {
  test('register with onTransform: callback fires each tick with current body state', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const states: Array<{ x: number; y: number }> = []
    world.register(
      { x: 100, y: 100 },
      { width: 100, height: 50 },
      { onTransform: (s) => states.push({ x: s.x, y: s.y }) },
    )
    world.tick(FIXED_DT_MS)
    world.tick(FIXED_DT_MS)
    expect(states.length).toBe(2)
    expect(states[0]!.x).toBeCloseTo(100, 1)
  })
})

describe('PhysicsWorld dragging', () => {
  test('while dragging, the body stays where setPosition places it across many ticks', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 100, y: 100 },
      { width: 100, height: 50 },
    )
    world.setDragging(handle, true)
    world.setPosition(handle, { x: 400, y: 300 })
    for (let i = 0; i < 60; i++) world.tick(FIXED_DT_MS)
    const pos = world.getPosition(handle)
    expect(pos.x).toBeCloseTo(400, 1)
    expect(pos.y).toBeCloseTo(300, 1)
  })

  test('on release, the breathing-mode spring returns the body to its anchor', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 100, y: 100 },
      { width: 100, height: 50 },
    )
    world.setDragging(handle, true)
    world.setPosition(handle, { x: 400, y: 300 })
    world.setDragging(handle, false)
    for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
    const pos = world.getPosition(handle)
    expect(Math.abs(pos.x - 100)).toBeLessThan(1)
    expect(Math.abs(pos.y - 100)).toBeLessThan(1)
  })

  test('setVelocity directly sets the body velocity (mass-independent)', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 400, y: 100 },
      { width: 100, height: 50 },
    )
    world.setVelocity(handle, { x: 5, y: 0 })
    world.tick(FIXED_DT_MS)
    const pos = world.getPosition(handle)
    expect(pos.x).toBeGreaterThan(401)
  })

  test('after release, applyImpulse adds velocity to a body that was dragged', () => {
    const release = (impulseX: number) => {
      const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
      const handle = world.register(
        { x: 100, y: 100 },
        { width: 100, height: 50 },
      )
      world.setDragging(handle, true)
      world.setPosition(handle, { x: 200, y: 100 })
      world.setDragging(handle, false)
      if (impulseX !== 0) world.applyImpulse(handle, { x: impulseX, y: 0 })
      world.tick(FIXED_DT_MS)
      return world.getPosition(handle).x
    }
    expect(release(100)).toBeGreaterThan(release(0))
  })
})

describe('PhysicsWorld card modes', () => {
  test('setMode("playground") relaxes the spring so the card stays where pushed', () => {
    const world = new PhysicsWorld({ viewport: { width: 800, height: 600 } })
    const handle = world.register(
      { x: 100, y: 100 },
      { width: 100, height: 50 },
    )
    world.setMode(handle, 'playground')
    world.applyImpulse(handle, { x: 30, y: 0 })
    for (let i = 0; i < 600; i++) world.tick(FIXED_DT_MS)
    const pos = world.getPosition(handle)
    expect(pos.x).toBeGreaterThan(150)
  })
})
