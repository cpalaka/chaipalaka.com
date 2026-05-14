import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import Home, { pageDef } from './Home'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { CardRegistryProvider } from '../card/CardRegistry'
import { PhysicsLayer } from '../card/CardLayer'

vi.mock('../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

function renderHome() {
    return render(
        <PhysicsProvider>
            <CardRegistryProvider>
                <PhysicsLayer />
                <Home />
            </CardRegistryProvider>
        </PhysicsProvider>,
    )
}

describe('Home — pageDef shape', () => {
    test('gravity is down', () => {
        expect(pageDef.gravity).toBe('down')
    })

    test('exactly 2 cards with ids card-a and card-b', () => {
        expect(pageDef.cards).toHaveLength(2)
        const ids = pageDef.cards.map((c) => c.id).sort()
        expect(ids).toEqual(['card-a', 'card-b'])
    })

    test('both cards are headline kind, parented to ceiling', () => {
        for (const c of pageDef.cards) {
            expect(c.kind).toBe('headline')
            expect(c.parent).toBe('ceiling')
        }
    })
})

describe('Home — render', () => {
    test('mounts without throwing', () => {
        expect(() => renderHome()).not.toThrow()
    })

    test('renders one article.physics-card per card with matching data-card-id', () => {
        const { container } = renderHome()
        const articles = Array.from(
            container.querySelectorAll('article.physics-card'),
        )
        expect(articles).toHaveLength(2)
        const ids = articles
            .map((a) => a.getAttribute('data-card-id'))
            .sort()
        expect(ids).toEqual(['card-a', 'card-b'])
    })
})
