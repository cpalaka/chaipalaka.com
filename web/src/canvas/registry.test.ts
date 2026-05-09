import { describe, test, expect } from 'vitest'
import { createRegistry } from './registry'
import type { BackgroundScene } from './types'

function makeScene(id: string): BackgroundScene {
  return {
    id,
    Component: () => null,
    fallbackColors: ['#000000', '#111111'],
    fallbackPng: `/fallbacks/${id}.png`,
  }
}

describe('BackgroundRegistry', () => {
  test('list() returns scenes in registration order', () => {
    const a = makeScene('a')
    const b = makeScene('b')
    const registry = createRegistry([a, b])
    const ids = registry.list().map((s) => s.id)
    expect(ids).toEqual(['a', 'b'])
  })

  test('get(id) returns the scene with that id, or undefined', () => {
    const a = makeScene('a')
    const registry = createRegistry([a])
    expect(registry.get('a')).toBe(a)
    expect(registry.get('does-not-exist')).toBeUndefined()
  })

  test('has(id) reflects whether the scene is registered', () => {
    const registry = createRegistry([makeScene('a')])
    expect(registry.has('a')).toBe(true)
    expect(registry.has('b')).toBe(false)
  })

  test('throws when two scenes share an id', () => {
    const dup1 = makeScene('flow-shader')
    const dup2 = makeScene('flow-shader')
    expect(() => createRegistry([dup1, dup2])).toThrow(/flow-shader/)
  })

  test('an empty input produces an empty registry', () => {
    const registry = createRegistry([])
    expect(registry.list()).toEqual([])
    expect(registry.has('anything')).toBe(false)
  })
})
