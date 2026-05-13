import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, cleanup, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PhysicsProvider, usePhysicsWorld } from '../physics/PhysicsContext'
import { CardRegistryProvider } from './CardRegistry'
import { PhysicsCardImpl } from './PhysicsCardImpl'
import { useMinimizedRegistry } from '../canvas/useMinimizedRegistry'
import type { PhysicsCardEntry } from './CardRegistry'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import type { MinimizedRegistry } from '../canvas/MinimizedRegistry'

vi.mock('../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

import { flipMorph } from '../canvas/flip'

// Helper: build a PhysicsCardEntry with sensible defaults.
function makeEntry(
    overrides: Partial<PhysicsCardEntry> = {},
): PhysicsCardEntry {
    return {
        id: overrides.id ?? 'card-1',
        parent: overrides.parent ?? null,
        trail: overrides.trail,
        kind: overrides.kind ?? 'card',
        buoyancy: overrides.buoyancy ?? 'heavy',
        anchor: overrides.anchor ?? { x: 200, y: 200 },
        content: {
            text: 'hello',
            width: 120,
            height: 80,
            variant: 'default',
            ...(overrides.content ?? {}),
        },
        state: 'active',
    }
}

function fireRealPointerDown(
    el: Element,
    opts: { onCardHeader?: boolean } = {},
) {
    const ev = new Event('pointerdown', {
        bubbles: true,
        cancelable: true,
    }) as Event & {
        clientX: number
        clientY: number
        pointerId: number
    }
    ev.clientX = 50
    ev.clientY = 50
    ev.pointerId = 1
    const target = opts.onCardHeader
        ? (el.querySelector('[data-card-header]') ?? el)
        : el
    target.dispatchEvent(ev)
}

async function flushRaf() {
    await act(async () => {
        await new Promise<void>((r) =>
            requestAnimationFrame(() => r(undefined)),
        )
    })
}

function renderWith(ui: React.ReactNode) {
    let world: PhysicsWorld | null = null
    let registry: MinimizedRegistry | null = null
    function Probe() {
        world = usePhysicsWorld()
        registry = useMinimizedRegistry()
        return null
    }
    const utils = render(
        <PhysicsProvider>
            <CardRegistryProvider>
                <Probe />
                {ui}
            </CardRegistryProvider>
        </PhysicsProvider>,
    )
    return {
        ...utils,
        getWorld: () => world!,
        getRegistry: () => registry!,
    }
}

// MinimizedRegistry is a module-level singleton. Each test that minimizes a
// card is responsible for restoring it (or using a unique id), so cross-test
// state doesn't bleed.
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('PhysicsCardImpl — article shape & data attrs', () => {
    test('renders article.physics-card with data-card-id and data-variant attrs', () => {
        const entry = makeEntry({
            id: 'shape-1',
            content: { text: 't', width: 120, height: 80, variant: 'lifelog' },
        })
        const { container } = renderWith(<PhysicsCardImpl entry={entry} />)
        const article = container.querySelector('article.physics-card')
        expect(article).toBeTruthy()
        expect(article!.getAttribute('data-card-id')).toBe('shape-1')
        expect(article!.getAttribute('data-variant')).toBe('lifelog')
    })
})

describe('PhysicsCardImpl — first-paint reveal gate', () => {
    test('article is rendered with visibility: hidden inline before the first RAF', () => {
        const entry = makeEntry({ id: 'reveal-1' })
        const { container } = renderWith(<PhysicsCardImpl entry={entry} />)
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        expect(article).toBeTruthy()
        expect(article.style.visibility).toBe('hidden')
    })

    test('after one RAF the visibility override is cleared', async () => {
        const entry = makeEntry({ id: 'reveal-2' })
        const { container } = renderWith(<PhysicsCardImpl entry={entry} />)
        await flushRaf()
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        expect(article.style.visibility).not.toBe('hidden')
    })
})

describe('PhysicsCardImpl — minimize', () => {
    test('renders a header bar with a Minimize button when minimizable=true', () => {
        const entry = makeEntry({
            id: 'min-1',
            content: {
                text: 't',
                width: 120,
                height: 80,
                minimizable: true,
                label: 'My card',
            },
        })
        const { container } = renderWith(<PhysicsCardImpl entry={entry} />)
        const article = container.querySelector('article.physics-card')!
        const header = article.querySelector('[data-card-header]')
        expect(header).toBeTruthy()
        const btn = header!.querySelector(
            'button[title="Minimize"]',
        ) as HTMLButtonElement | null
        expect(btn).toBeTruthy()
    })

    test('clicking the minimize button moves the card to the minimized registry and unmounts the article', async () => {
        const entry = makeEntry({
            id: 'min-2',
            kind: 'lifelog',
            content: {
                text: 't',
                width: 120,
                height: 80,
                minimizable: true,
                label: 'Min me',
            },
        })
        const { container, getRegistry } = renderWith(
            <PhysicsCardImpl entry={entry} />,
        )
        await flushRaf()
        const btn = container.querySelector(
            'button[title="Minimize"]',
        ) as HTMLButtonElement
        expect(btn).toBeTruthy()

        await act(async () => {
            fireEvent.click(btn)
        })

        const reg = getRegistry()
        const list = reg.list()
        expect(list).toHaveLength(1)
        expect(list[0]!.id).toBe('min-2')
        expect(list[0]!.label).toBe('Min me')
        expect(list[0]!.kind).toBe('lifelog')
        expect(list[0]!.fromRect).toBeTruthy()

        // After minimize, the article should be gone from the DOM.
        expect(container.querySelector('article.physics-card')).toBeNull()

        // Clean up so the singleton doesn't bleed.
        reg.restore('min-2')
    })

    test('falls back to text as the label when no explicit label is provided', async () => {
        const entry = makeEntry({
            id: 'min-3',
            content: {
                text: 'fallback-text',
                width: 120,
                height: 80,
                minimizable: true,
            },
        })
        const { container, getRegistry } = renderWith(
            <PhysicsCardImpl entry={entry} />,
        )
        await flushRaf()
        const btn = container.querySelector(
            'button[title="Minimize"]',
        ) as HTMLButtonElement
        await act(async () => {
            fireEvent.click(btn)
        })
        const reg = getRegistry()
        expect(reg.list()[0]!.label).toBe('fallback-text')
        reg.restore('min-3')
    })
})

describe('PhysicsCardImpl — drag handler install', () => {
    test('draggable=true (default) sets cursor: grabbing on pointerdown', () => {
        const entry = makeEntry({ id: 'drag-on' })
        const { container } = renderWith(<PhysicsCardImpl entry={entry} />)
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        article.setPointerCapture = () => {}
        fireRealPointerDown(article)
        expect(article.style.cursor).toBe('grabbing')
    })

    test('draggable=true calls world.setDragging(handle, true) on pointerdown', () => {
        const entry = makeEntry({ id: 'drag-spy' })
        const { container, getWorld } = renderWith(
            <PhysicsCardImpl entry={entry} />,
        )
        const setDragging = vi.spyOn(getWorld(), 'setDragging')
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        article.setPointerCapture = () => {}
        fireRealPointerDown(article)
        expect(setDragging).toHaveBeenCalledTimes(1)
        const handle = getWorld().getHandleById('drag-spy')
        expect(setDragging).toHaveBeenCalledWith(handle, true)
    })

    test('draggable=false does NOT change cursor or call setDragging on pointerdown', () => {
        const entry = makeEntry({
            id: 'drag-off',
            content: { text: 't', width: 120, height: 80, draggable: false },
        })
        const { container, getWorld } = renderWith(
            <PhysicsCardImpl entry={entry} />,
        )
        const setDragging = vi.spyOn(getWorld(), 'setDragging')
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        article.setPointerCapture = () => {}
        fireRealPointerDown(article)
        expect(article.style.cursor).not.toBe('grabbing')
        expect(setDragging).not.toHaveBeenCalled()
    })
})

describe('PhysicsCardImpl — parent tether wiring', () => {
    test('parent="ceiling" wires a tether from the card to the ceiling handle', async () => {
        const entry = makeEntry({ id: 'tether-ceil', parent: 'ceiling' })
        const { getWorld } = renderWith(<PhysicsCardImpl entry={entry} />)
        await flushRaf()
        const world = getWorld()
        const childHandle = world.getHandleById('tether-ceil')!
        const records = world.tether
            .records()
            .filter((r) => r.child === childHandle)
        expect(records).toHaveLength(1)
        expect(records[0]!.parent).toBe(world.ceilingHandle)
    })

    test('parent="floor" wires a tether from the card to the floor handle', async () => {
        const entry = makeEntry({ id: 'tether-floor', parent: 'floor' })
        const { getWorld } = renderWith(<PhysicsCardImpl entry={entry} />)
        await flushRaf()
        const world = getWorld()
        const childHandle = world.getHandleById('tether-floor')!
        const records = world.tether
            .records()
            .filter((r) => r.child === childHandle)
        expect(records).toHaveLength(1)
        expect(records[0]!.parent).toBe(world.floorHandle)
    })

    test('parent=<cardId> resolves to a sibling card already registered in the same render', async () => {
        const parentEntry = makeEntry({ id: 'parent-card', parent: 'ceiling' })
        const childEntry = makeEntry({
            id: 'child-card',
            parent: 'parent-card',
            anchor: { x: 300, y: 300 },
        })
        const { getWorld } = renderWith(
            <>
                <PhysicsCardImpl entry={parentEntry} />
                <PhysicsCardImpl entry={childEntry} />
            </>,
        )
        await flushRaf()
        const world = getWorld()
        const parentHandle = world.getHandleById('parent-card')!
        const childHandle = world.getHandleById('child-card')!
        const childRecords = world.tether
            .records()
            .filter((r) => r.child === childHandle)
        expect(childRecords).toHaveLength(1)
        expect(childRecords[0]!.parent).toBe(parentHandle)
    })

    test('parent referring to a non-existent card retries on the next RAF, then warns and skips', async () => {
        const warnSpy = vi.spyOn(console, 'warn')
        const entry = makeEntry({
            id: 'lonely-child',
            parent: 'nonexistent-parent',
        })
        const { getWorld } = renderWith(<PhysicsCardImpl entry={entry} />)
        // First RAF flushes the reveal gate; second flushes the parent-resolve retry.
        await flushRaf()
        await flushRaf()
        const world = getWorld()
        const childHandle = world.getHandleById('lonely-child')!
        const childRecords = world.tether
            .records()
            .filter((r) => r.child === childHandle)
        expect(childRecords).toHaveLength(0)
        expect(warnSpy).toHaveBeenCalled()
        expect(warnSpy.mock.calls[0]![0]).toContain('"nonexistent-parent"')
    })

    test('trail tether wires a second tether to the trail target', async () => {
        const entry = makeEntry({
            id: 'dual-tether',
            parent: 'ceiling',
            trail: 'floor',
        })
        const { getWorld } = renderWith(<PhysicsCardImpl entry={entry} />)
        await flushRaf()
        const world = getWorld()
        const childHandle = world.getHandleById('dual-tether')!
        const records = world.tether
            .records()
            .filter((r) => r.child === childHandle)
        expect(records).toHaveLength(2)
        const parents = records.map((r) => r.parent).sort()
        expect(parents).toEqual([world.ceilingHandle, world.floorHandle].sort())
    })
})

describe('PhysicsCardImpl — anchor changes', () => {
    test('changing the anchor calls world.setAnchor and re-wires the parent tether', async () => {
        function Harness() {
            const [anchor, setAnchor] = useState({ x: 100, y: 100 })
            return (
                <>
                    <PhysicsCardImpl
                        entry={makeEntry({
                            id: 'anchor-card',
                            parent: 'ceiling',
                            anchor,
                        })}
                    />
                    <button
                        data-testid="bump"
                        type="button"
                        onClick={() => setAnchor({ x: 250, y: 250 })}
                    >
                        bump
                    </button>
                </>
            )
        }

        const { container, getWorld } = renderWith(<Harness />)
        await flushRaf()
        const world = getWorld()
        const setAnchorSpy = vi.spyOn(world, 'setAnchor')
        const childHandle = world.getHandleById('anchor-card')!
        const recordsBefore = world.tether
            .records()
            .filter((r) => r.child === childHandle)
        expect(recordsBefore).toHaveLength(1)
        const oldTetherHandle = recordsBefore[0]!.handle

        await act(async () => {
            fireEvent.click(container.querySelector('[data-testid="bump"]')!)
        })
        await flushRaf()

        expect(setAnchorSpy).toHaveBeenCalledWith(childHandle, {
            x: 250,
            y: 250,
        })
        const recordsAfter = world.tether
            .records()
            .filter((r) => r.child === childHandle)
        // Still exactly one tether to the ceiling, but a new handle (old one
        // was untethered + a fresh one wired).
        expect(recordsAfter).toHaveLength(1)
        expect(recordsAfter[0]!.parent).toBe(world.ceilingHandle)
        expect(recordsAfter[0]!.handle).not.toBe(oldTetherHandle)
    })
})

describe('PhysicsCardImpl — unmount cleanup', () => {
    test('unmounting untethers, unregisters the body, and the card disappears from the world', async () => {
        function Harness({ mounted }: { mounted: boolean }) {
            return mounted ? (
                <PhysicsCardImpl
                    entry={makeEntry({ id: 'unmount-me', parent: 'ceiling' })}
                />
            ) : null
        }
        let world: PhysicsWorld | null = null
        function Probe() {
            world = usePhysicsWorld()
            return null
        }
        const { rerender } = render(
            <PhysicsProvider>
                <CardRegistryProvider>
                    <Probe />
                    <Harness mounted={true} />
                </CardRegistryProvider>
            </PhysicsProvider>,
        )
        await flushRaf()
        expect(world!.getHandleById('unmount-me')).toBeTruthy()
        expect(
            world!.tether
                .records()
                .some((r) => r.child === world!.getHandleById('unmount-me')!),
        ).toBe(true)

        rerender(
            <PhysicsProvider>
                <CardRegistryProvider>
                    <Probe />
                    <Harness mounted={false} />
                </CardRegistryProvider>
            </PhysicsProvider>,
        )
        await flushRaf()
        expect(world!.getHandleById('unmount-me')).toBeUndefined()
        expect(world!.tether.records()).toHaveLength(0)
    })
})

describe('PhysicsCardImpl — restore from chip', () => {
    test('un-minimizing with a pending chip rect bypasses the reveal-gate hide and calls flipMorph', async () => {
        const entry = makeEntry({
            id: 'restore-me',
            content: {
                text: 'restorable',
                width: 200,
                height: 100,
                minimizable: true,
                label: 'Restorable',
            },
        })
        const { container, getRegistry } = renderWith(
            <PhysicsCardImpl entry={entry} />,
        )
        await flushRaf()

        // Minimize via the in-DOM button so registry.minimize captures a real fromRect.
        const btn = container.querySelector(
            'button[title="Minimize"]',
        ) as HTMLButtonElement
        await act(async () => {
            fireEvent.click(btn)
        })
        expect(container.querySelector('article.physics-card')).toBeNull()

        const reg = getRegistry()
        const fromChipRect = {
            left: 10,
            top: 20,
            right: 110,
            bottom: 120,
            width: 100,
            height: 100,
            x: 10,
            y: 20,
            toJSON() {
                return {}
            },
        } as DOMRect

        // Restore with an explicit chip rect — this populates pendingRestoreRects
        // for the card so its useEffect on un-minimize will see it.
        await act(async () => {
            reg.restore('restore-me', fromChipRect)
        })

        // The article has re-mounted. The restore-from-chip effect runs
        // synchronously after the main effect; it calls setRevealed(true)
        // immediately, so React re-renders without the visibility:hidden
        // override.
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        expect(article).toBeTruthy()
        expect(article.style.visibility).not.toBe('hidden')

        // flipMorph fires inside a requestAnimationFrame after the rect is
        // consumed — advance one frame.
        await flushRaf()
        expect(flipMorph).toHaveBeenCalledTimes(1)
        const callArgs = (flipMorph as unknown as ReturnType<typeof vi.fn>).mock
            .calls[0]!
        expect(callArgs[0]).toBe(fromChipRect)
        expect(callArgs[1]).toBe(article)
        expect(callArgs[2]).toEqual(
            expect.objectContaining({ opacityFrom: 0.5 }),
        )

        // Clean up so the singleton stays empty.
        reg.restore('restore-me')
    })
})
