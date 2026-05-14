import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Stuff, { pageDef } from './Stuff'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { CardRegistryProvider } from '../card/CardRegistry'
import { CardLayer } from '../card/CardLayer'

vi.mock('../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

function renderStuff() {
    return render(
        <MemoryRouter initialEntries={['/stuff']}>
            <PhysicsProvider>
                <CardRegistryProvider>
                    <CardLayer />
                    <Stuff />
                </CardRegistryProvider>
            </PhysicsProvider>
        </MemoryRouter>,
    )
}

describe('Stuff — pageDef shape', () => {
    test('has 4 cards with the expected ids', () => {
        const ids = pageDef.cards.map((c) => c.id).sort()
        expect(ids).toEqual([
            'stuff-digital-art',
            'stuff-flash',
            'stuff-site',
            'stuff-software',
        ])
    })

    test('all cards are portfolio kind, parented to ceiling', () => {
        for (const c of pageDef.cards) {
            expect(c.kind).toBe('portfolio')
            expect(c.parent).toBe('ceiling')
        }
    })
})

describe('Stuff — render', () => {
    test('mounts without throwing', () => {
        expect(() => renderStuff()).not.toThrow()
    })

    test('Flash card contains a link to /stuff/flash', () => {
        const { container } = renderStuff()
        const flashLink = container.querySelector('a[href="/stuff/flash"]')
        expect(flashLink).toBeTruthy()
    })

    test('three coming-soon cards render aria-disabled articles', () => {
        const { container } = renderStuff()
        const disabledArticles = container.querySelectorAll(
            'article[aria-disabled="true"]',
        )
        expect(disabledArticles).toHaveLength(3)
    })
})
