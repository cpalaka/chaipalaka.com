import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import Home, { pageDef } from './Home'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { CardRegistryProvider } from '../card/CardRegistry'
import { CardLayer } from '../card/CardLayer'

vi.mock('../canvas/flip', () => ({
    flipMorph: vi.fn(),
}))

const HOME_TEXT = 'chaipalaka.com'
const LETTER_IDS = HOME_TEXT.split('').map((_ch, i) => `letter-${i}`)
const ALL_IDS = [...LETTER_IDS, 'balloon']

function renderHome() {
    return render(
        <PhysicsProvider>
            <CardRegistryProvider>
                <CardLayer />
                <Home />
            </CardRegistryProvider>
        </PhysicsProvider>,
    )
}

describe('Home — pageDef shape', () => {
    test('gravity is down', () => {
        expect(pageDef.gravity).toBe('down')
    })

    test('one letter card per character of chaipalaka.com plus a balloon', () => {
        expect(pageDef.cards).toHaveLength(ALL_IDS.length)
        expect(pageDef.cards.map((c) => c.id).sort()).toEqual([...ALL_IDS].sort())
    })

    test('letters are headline kind parented to ceiling', () => {
        for (const c of pageDef.cards) {
            if (!c.id.startsWith('letter-')) continue
            expect(c.kind).toBe('headline')
            expect(c.parent).toBe('ceiling')
        }
    })

    test('balloon is note kind parented to floor', () => {
        const balloon = pageDef.cards.find((c) => c.id === 'balloon')
        expect(balloon).toBeDefined()
        expect(balloon!.kind).toBe('note')
        expect(balloon!.parent).toBe('floor')
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
        expect(articles).toHaveLength(ALL_IDS.length)
        const ids = articles
            .map((a) => a.getAttribute('data-card-id'))
            .sort() as string[]
        expect(ids).toEqual([...ALL_IDS].sort())
    })
})
