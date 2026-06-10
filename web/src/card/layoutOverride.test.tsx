import { describe, test, expect, afterEach } from 'vitest'
import { act, render, cleanup } from '@testing-library/react'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { CardRegistryProvider, useCardRegistryEntries } from './CardRegistry'
import { Page } from './Page'
import {
    applyLayoutOverride,
    setLayoutOverride,
} from './layoutOverride'
import type { RouteLayout } from '../routes/routeLayout'
import type { PageSpec } from '../physics/PageSpec'
import type { CardEntry } from './CardRegistry'

const pageDef: PageSpec = {
    gravity: 'down',
    cards: [
        {
            id: 'a',
            kind: 'headline',
            parent: 'ceiling',
            anchor: () => ({ x: 200, y: 100 }),
        },
        {
            id: 'b',
            kind: 'note',
            parent: 'a',
            anchor: () => ({ x: 200, y: 300 }),
        },
    ],
}

const override: RouteLayout = {
    gravity: 'up',
    cards: [
        { id: 'a', kind: 'headline', parent: 'floor', anchor: { fx: 0.5, fy: 0.5 } },
        { id: 'b', kind: 'note', parent: null, anchor: { fx: 0.25, fy: 0.25 } },
    ],
}

afterEach(() => {
    setLayoutOverride(null)
    cleanup()
})

describe('applyLayoutOverride', () => {
    test('null override returns the pageDef untouched', () => {
        expect(applyLayoutOverride(pageDef, null)).toBe(pageDef)
    })

    test('matching ids: gravity, parents, and fraction anchors take over; sections survive', () => {
        const withSections: PageSpec = {
            ...pageDef,
            sections: { mode: 'author', sections: [{ cardIds: ['a'] }] },
        }
        const applied = applyLayoutOverride(withSections, override)
        expect(applied.gravity).toBe('up')
        expect(applied.cards.map((c) => c.parent)).toEqual(['floor', null])
        expect(applied.cards[0]!.anchor({ width: 1000, height: 600 })).toEqual({
            x: 500,
            y: 300,
        })
        expect(applied.sections).toEqual(withSections.sections)
    })

    test('id mismatch returns the pageDef untouched — a stale override never crosses routes', () => {
        const other: RouteLayout = {
            gravity: 'up',
            cards: [{ id: 'elsewhere', kind: 'note', parent: null, anchor: { fx: 0, fy: 0 } }],
        }
        expect(applyLayoutOverride(pageDef, other)).toBe(pageDef)
    })
})

describe('Page + layout override', () => {
    test('setting the override re-renders cards at the overridden anchors', () => {
        let entries: readonly CardEntry[] = []
        function Probe() {
            entries = useCardRegistryEntries()
            return null
        }
        render(
            <PhysicsProvider>
                <CardRegistryProvider>
                    <Probe />
                    <Page
                        pageDef={pageDef}
                        cardContent={{
                            a: { text: 'A', width: 240, height: 120 },
                            b: { text: 'B', width: 200, height: 100 },
                        }}
                    />
                </CardRegistryProvider>
            </PhysicsProvider>,
        )
        const before = entries.find((e) => e.id === 'a')!.anchor
        // jsdom viewport is 1024x768
        expect(before).toEqual({ x: 200, y: 100 })

        act(() => {
            setLayoutOverride(override)
        })
        const after = entries.find((e) => e.id === 'a')!
        expect(after.anchor).toEqual({ x: 512, y: 384 })
        expect(after.parent).toBe('floor')
    })
})
