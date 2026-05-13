import { describe, test, expect, afterEach, vi } from 'vitest'
import { act, render, cleanup } from '@testing-library/react'
import { PhysicsProvider } from '../physics/PhysicsContext'
import {
    CardRegistryProvider,
    useCardRegistry,
} from './CardRegistry'
import { PhysicsLayer } from './PhysicsLayer'
import type { CardRegistryAPI, PhysicsCardEntry } from './CardRegistry'

vi.mock('../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

afterEach(() => {
    cleanup()
})

function makeEntry(id: string, overrides: Partial<PhysicsCardEntry> = {}): PhysicsCardEntry {
    return {
        id,
        parent: null,
        kind: 'card',
        buoyancy: 'heavy',
        anchor: { x: 100, y: 100 },
        content: {
            text: id,
            width: 120,
            height: 80,
            variant: 'default',
        },
        state: 'active',
        ...overrides,
    }
}

function renderLayer() {
    let api: CardRegistryAPI | null = null
    function Probe() {
        api = useCardRegistry()
        return null
    }
    const utils = render(
        <PhysicsProvider>
            <CardRegistryProvider>
                <Probe />
                <PhysicsLayer />
            </CardRegistryProvider>
        </PhysicsProvider>,
    )
    return { ...utils, getApi: () => api! }
}

describe('PhysicsLayer', () => {
    test('renders a <div data-physics-layer> wrapper', () => {
        const { container } = renderLayer()
        expect(
            container.querySelector('[data-physics-layer]'),
        ).toBeTruthy()
    })

    test('renders one article per registered entry with matching data-card-id', async () => {
        const { container, getApi } = renderLayer()
        await act(async () => {
            getApi().register(makeEntry('layer-a'))
            getApi().register(makeEntry('layer-b'))
        })
        const articles = container.querySelectorAll(
            'article.physics-card',
        )
        expect(articles).toHaveLength(2)
        const ids = Array.from(articles)
            .map((a) => a.getAttribute('data-card-id'))
            .sort()
        expect(ids).toEqual(['layer-a', 'layer-b'])
    })

    test('registering a new entry adds an article; releasing removes it', async () => {
        const { container, getApi } = renderLayer()
        await act(async () => {
            getApi().register(makeEntry('layer-x'))
            getApi().register(makeEntry('layer-y'))
        })
        expect(
            container.querySelectorAll('article.physics-card'),
        ).toHaveLength(2)

        await act(async () => {
            getApi().register(makeEntry('layer-z'))
        })
        expect(
            container.querySelectorAll('article.physics-card'),
        ).toHaveLength(3)

        await act(async () => {
            getApi().release('layer-y')
        })
        const remaining = Array.from(
            container.querySelectorAll('article.physics-card'),
        )
            .map((a) => a.getAttribute('data-card-id'))
            .sort()
        expect(remaining).toEqual(['layer-x', 'layer-z'])
    })
})
