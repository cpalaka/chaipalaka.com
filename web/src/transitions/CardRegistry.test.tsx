import { describe, test, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CardRegistryProvider, useCardRegistry } from './CardRegistry'
import type { RegisterArgs } from './CardRegistry'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
    <CardRegistryProvider>{children}</CardRegistryProvider>
)

const entryA: RegisterArgs = {
    id: 'a',
    parent: 'ceiling',
    kind: 'headline',
    buoyancy: 'heavy',
    anchor: { x: 100, y: 100 },
    content: { text: 'hello', width: 200, height: 100 },
}

const entryB: RegisterArgs = {
    id: 'b',
    parent: 'floor',
    kind: 'note',
    buoyancy: 'balloon',
    anchor: { x: 200, y: 400 },
    content: { text: 'world', width: 200, height: 100 },
}

describe('CardRegistry', () => {
    test('register adds an entry visible in snapshot', () => {
        const { result } = renderHook(() => useCardRegistry(), { wrapper })

        act(() => {
            result.current.register(entryA)
        })

        const entries = result.current.snapshot()
        expect(entries).toHaveLength(1)
        expect(entries[0]).toMatchObject({ id: 'a', state: 'active' })
    })

    test('requestUnregister removes entry when not exiting', () => {
        const { result } = renderHook(() => useCardRegistry(), { wrapper })

        act(() => {
            result.current.register(entryA)
            result.current.requestUnregister('a')
        })

        expect(result.current.snapshot()).toHaveLength(0)
    })

    test('markExiting + requestUnregister defers removal until release', () => {
        const { result } = renderHook(() => useCardRegistry(), { wrapper })

        act(() => {
            result.current.register(entryA)
            result.current.markExiting('a')
            result.current.requestUnregister('a')
        })

        const exiting = result.current.snapshot()
        expect(exiting).toHaveLength(1)
        expect(exiting[0]?.state).toBe('exiting')

        act(() => {
            result.current.release('a')
        })

        expect(result.current.snapshot()).toHaveLength(0)
    })

    test('register with existing id preserves lifecycle state (upsert)', () => {
        const { result } = renderHook(() => useCardRegistry(), { wrapper })

        act(() => {
            result.current.register(entryA)
            result.current.markExiting('a')
        })
        expect(result.current.snapshot()[0]?.state).toBe('exiting')

        act(() => {
            result.current.register({
                ...entryA,
                content: { ...entryA.content, text: 'updated' },
            })
        })

        const updated = result.current.snapshot()
        expect(updated).toHaveLength(1)
        expect(updated[0]?.state).toBe('exiting')
        expect(updated[0]?.content.text).toBe('updated')
    })

    test('multiple entries + selective release', () => {
        const { result } = renderHook(() => useCardRegistry(), { wrapper })

        act(() => {
            result.current.register(entryA)
            result.current.register(entryB)
            result.current.markExiting('a')
            result.current.markExiting('b')
        })
        expect(result.current.snapshot()).toHaveLength(2)

        act(() => {
            result.current.release('a')
        })

        const remaining = result.current.snapshot()
        expect(remaining).toHaveLength(1)
        expect(remaining[0]?.id).toBe('b')
    })

    test('snapshot returns stable reference when no changes occur', () => {
        const { result } = renderHook(() => useCardRegistry(), { wrapper })

        act(() => {
            result.current.register(entryA)
        })

        const first = result.current.snapshot()
        const second = result.current.snapshot()
        expect(first).toBe(second)
    })
})
