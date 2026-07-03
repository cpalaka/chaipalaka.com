import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, cleanup, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { PhysicsProvider, usePhysicsWorld } from '../physics/PhysicsContext'
import { CardRegistryProvider } from './CardRegistry'
import { CardImpl } from './CardImpl'
import { setArrangeMode, subscribeArrangeDrag } from './arrangeMode'
import type { ArrangeDragReport } from './arrangeMode'
import type { CardEntry } from './CardRegistry'
import type { PhysicsWorld } from '../physics/PhysicsWorld'

// Helper: build a CardEntry with sensible defaults.
function makeEntry(
    overrides: Partial<CardEntry> = {},
): CardEntry {
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
        state: overrides.state ?? 'active',
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
    function Probe() {
        world = usePhysicsWorld()
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
    }
}

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('CardImpl — article shape & data attrs', () => {
    test('renders article.physics-card with data-card-id and data-variant attrs', () => {
        const entry = makeEntry({
            id: 'shape-1',
            content: { text: 't', width: 120, height: 80, variant: 'lifelog' },
        })
        const { container } = renderWith(<CardImpl entry={entry} />)
        const article = container.querySelector('article.physics-card')
        expect(article).toBeTruthy()
        expect(article!.getAttribute('data-card-id')).toBe('shape-1')
        expect(article!.getAttribute('data-variant')).toBe('lifelog')
    })
})

describe('CardImpl — lifecycle visibility (I-1)', () => {
    test('article has visibility: hidden while entry.state === "spawning"', () => {
        const entry = makeEntry({ id: 'spawning-1', state: 'spawning' })
        const { container } = renderWith(<CardImpl entry={entry} />)
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        expect(article).toBeTruthy()
        expect(article.style.visibility).toBe('hidden')
    })

    test('article visibility is not hidden when entry.state === "active"', () => {
        const entry = makeEntry({ id: 'active-1', state: 'active' })
        const { container } = renderWith(<CardImpl entry={entry} />)
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        expect(article.style.visibility).not.toBe('hidden')
    })
})

describe('CardImpl — drag handler install', () => {
    test('draggable=true (default) sets cursor: grabbing on pointerdown', () => {
        const entry = makeEntry({ id: 'drag-on' })
        const { container } = renderWith(<CardImpl entry={entry} />)
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
            <CardImpl entry={entry} />,
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
            <CardImpl entry={entry} />,
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

describe('CardImpl — arrange-mode drag', () => {
    afterEach(() => {
        setArrangeMode(false)
    })

    function fireWindowPointerMove(x: number, y: number) {
        const ev = new Event('pointermove', { bubbles: true }) as Event & {
            clientX: number
            clientY: number
            timeStamp: number
        }
        ev.clientX = x
        ev.clientY = y
        window.dispatchEvent(ev)
    }

    test('in arrange mode, pointerdown reports selection and does not grab the body', () => {
        setArrangeMode(true)
        const reports: ArrangeDragReport[] = []
        const unsubscribe = subscribeArrangeDrag((r) => reports.push(r))
        const entry = makeEntry({ id: 'arrange-1' })
        const { container, getWorld } = renderWith(<CardImpl entry={entry} />)
        const setDragging = vi.spyOn(getWorld(), 'setDragging')
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        article.setPointerCapture = () => {}
        fireRealPointerDown(article)
        expect(setDragging).not.toHaveBeenCalled()
        expect(reports).toEqual([{ id: 'arrange-1', x: 50, y: 50, type: 'down' }])
        unsubscribe()
    })

    test('in arrange mode, dragging reports anchor moves instead of moving the body', () => {
        setArrangeMode(true)
        const reports: ArrangeDragReport[] = []
        const unsubscribe = subscribeArrangeDrag((r) => reports.push(r))
        const entry = makeEntry({ id: 'arrange-2' })
        const { container, getWorld } = renderWith(<CardImpl entry={entry} />)
        const setPosition = vi.spyOn(getWorld(), 'setPosition')
        const setVelocity = vi.spyOn(getWorld(), 'setVelocity')
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        article.setPointerCapture = () => {}
        article.releasePointerCapture = () => {}
        fireRealPointerDown(article)
        fireWindowPointerMove(80, 120)
        fireEvent.pointerUp(window)
        expect(setPosition).not.toHaveBeenCalled()
        expect(setVelocity).not.toHaveBeenCalled()
        expect(reports).toEqual([
            { id: 'arrange-2', x: 50, y: 50, type: 'down' },
            { id: 'arrange-2', x: 80, y: 120, type: 'move' },
        ])
        unsubscribe()
    })

    test('with arrange mode off, dragging drives the body as before', () => {
        const entry = makeEntry({ id: 'arrange-off' })
        const { container, getWorld } = renderWith(<CardImpl entry={entry} />)
        const setPosition = vi.spyOn(getWorld(), 'setPosition')
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        article.setPointerCapture = () => {}
        fireRealPointerDown(article)
        fireWindowPointerMove(80, 120)
        expect(setPosition).toHaveBeenCalled()
    })
})

describe('CardImpl — parent tether wiring', () => {
    test('parent="ceiling" wires a tether from the card to the ceiling handle', async () => {
        const entry = makeEntry({ id: 'tether-ceil', parent: 'ceiling' })
        const { getWorld } = renderWith(<CardImpl entry={entry} />)
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
        const { getWorld } = renderWith(<CardImpl entry={entry} />)
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
                <CardImpl entry={parentEntry} />
                <CardImpl entry={childEntry} />
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
        const { getWorld } = renderWith(<CardImpl entry={entry} />)
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
        const { getWorld } = renderWith(<CardImpl entry={entry} />)
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

describe('CardImpl — anchor changes', () => {
    test('changing the anchor calls world.setAnchor and re-wires the parent tether', async () => {
        function Harness() {
            const [anchor, setAnchor] = useState({ x: 100, y: 100 })
            return (
                <>
                    <CardImpl
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

describe('CardImpl — unmount cleanup', () => {
    test('unmounting untethers, unregisters the body, and the card disappears from the world', async () => {
        function Harness({ mounted }: { mounted: boolean }) {
            return mounted ? (
                <CardImpl
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

describe('CardImpl — drift spawn (§3.5)', () => {
    test('spawns the body AT the layout anchor (no gravity-aligned offset)', () => {
        const entry = makeEntry({ id: 'spawn-anchor', anchor: { x: 320, y: 240 } })
        const { getWorld } = renderWith(<CardImpl entry={entry} />)
        const world = getWorld()
        const handle = world.getHandleById('spawn-anchor')!
        const p = world.getPosition(handle)
        expect(p.x).toBeCloseTo(320, 6)
        expect(p.y).toBeCloseTo(240, 6)
    })

    test('applies a small nonzero initial velocity ("the route breathes in")', () => {
        const entry = makeEntry({ id: 'spawn-kick', anchor: { x: 200, y: 200 } })
        const { getWorld } = renderWith(<CardImpl entry={entry} />)
        const world = getWorld()
        const handle = world.getHandleById('spawn-kick')!
        const v = world.getVelocity(handle)
        const mag = Math.hypot(v.x, v.y)
        expect(mag).toBeGreaterThan(0)
        expect(mag).toBeLessThanOrEqual(30) // "small"
    })

    // D8 / AC#4 — prefers-reduced-motion ⇒ cards still. The spawn kick runs in
    // CardImpl's mount effect, BEFORE the route's usePageDef sets driftScale 0
    // (CardLayer precedes Outlet), so world.getDriftScale() can't gate it — the
    // kick reads matchMedia directly. Without the gate a reduced-motion user
    // sees every card glide hundreds of px on cold load (task-042.04 review ①).
    test('reduced-motion: no breathe-in kick on spawn (D8/AC#4)', () => {
        const spy = vi.spyOn(window, 'matchMedia').mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as MediaQueryList)
        try {
            const entry = makeEntry({ id: 'spawn-reduced', anchor: { x: 200, y: 200 } })
            const { getWorld } = renderWith(<CardImpl entry={entry} />)
            const world = getWorld()
            const handle = world.getHandleById('spawn-reduced')!
            const v = world.getVelocity(handle)
            expect(Math.hypot(v.x, v.y)).toBe(0) // still — no spawn glide
        } finally {
            spy.mockRestore()
        }
    })
})
