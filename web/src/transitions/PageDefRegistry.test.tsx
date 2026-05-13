import { describe, test, expect } from 'vitest'
import { renderHook, render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { type ReactNode } from 'react'
import {
    PageDefRegistryProvider,
    usePageDefRegistry,
    useRegisterPageDef,
} from './PageDefRegistry'
import type { PageDef } from '../physics/PageDef'

function makeDef(): PageDef {
    return { gravity: 'down', cards: [] }
}

const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>
        <PageDefRegistryProvider>{children}</PageDefRegistryProvider>
    </MemoryRouter>
)

describe('PageDefRegistry', () => {
    test('register + resolve round-trip', () => {
        const { result } = renderHook(() => usePageDefRegistry(), { wrapper })
        const def = makeDef()

        act(() => {
            result.current.register('/blog', def)
        })

        expect(result.current.resolve('/blog')).toBe(def)
    })

    test('resolve returns undefined for unknown path', () => {
        const { result } = renderHook(() => usePageDefRegistry(), { wrapper })

        expect(result.current.resolve('/nowhere')).toBeUndefined()
    })

    test('unregister with the same pageDef removes the entry', () => {
        const { result } = renderHook(() => usePageDefRegistry(), { wrapper })
        const def = makeDef()

        act(() => {
            result.current.register('/blog', def)
            result.current.unregister('/blog', def)
        })

        expect(result.current.resolve('/blog')).toBeUndefined()
    })

    test('unregister with a stale pageDef is a no-op (fast remount race)', () => {
        const { result } = renderHook(() => usePageDefRegistry(), { wrapper })
        const defA = makeDef()
        const defB = makeDef()

        act(() => {
            result.current.register('/blog', defA)
            result.current.register('/blog', defB) // B overwrites A
            result.current.unregister('/blog', defA) // stale unregister
        })

        expect(result.current.resolve('/blog')).toBe(defB)
    })

    test('register with same path overwrites', () => {
        const { result } = renderHook(() => usePageDefRegistry(), { wrapper })
        const defA = makeDef()
        const defB = makeDef()

        act(() => {
            result.current.register('/blog', defA)
            result.current.register('/blog', defB)
        })

        expect(result.current.resolve('/blog')).toBe(defB)
    })

    test('useRegisterPageDef registers under the current pathname', () => {
        const def = makeDef()

        let resolveRef:
            | ReturnType<typeof usePageDefRegistry>['resolve']
            | null = null
        function Spy() {
            resolveRef = usePageDefRegistry().resolve
            return null
        }
        function Probe() {
            useRegisterPageDef(def)
            return null
        }

        render(
            <MemoryRouter initialEntries={['/stuff/flash/foo']}>
                <PageDefRegistryProvider>
                    <Spy />
                    <Probe />
                </PageDefRegistryProvider>
            </MemoryRouter>,
        )

        expect(resolveRef!('/stuff/flash/foo')).toBe(def)
        expect(resolveRef!('/stuff/flash')).toBeUndefined()
    })

    test('useRegisterPageDef unmount clears the entry', () => {
        const def = makeDef()

        function Probe() {
            useRegisterPageDef(def)
            return null
        }
        function Mounter({ show }: { show: boolean }) {
            return show ? <Probe /> : null
        }

        let resolveRef:
            | ReturnType<typeof usePageDefRegistry>['resolve']
            | null = null
        function Spy() {
            resolveRef = usePageDefRegistry().resolve
            return null
        }

        const { rerender } = render(
            <MemoryRouter initialEntries={['/blog']}>
                <PageDefRegistryProvider>
                    <Spy />
                    <Mounter show={true} />
                </PageDefRegistryProvider>
            </MemoryRouter>,
        )

        expect(resolveRef!('/blog')).toBe(def)

        rerender(
            <MemoryRouter initialEntries={['/blog']}>
                <PageDefRegistryProvider>
                    <Spy />
                    <Mounter show={false} />
                </PageDefRegistryProvider>
            </MemoryRouter>,
        )

        expect(resolveRef!('/blog')).toBeUndefined()
    })
})
