import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import Home, { pageDef } from './Home'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { CardRegistryProvider } from '../card/CardRegistry'
import { PinProvider } from '../pin/PinContext'

function renderHome() {
    return render(
        <PhysicsProvider>
            <CardRegistryProvider>
                <PinProvider>
                    <Home />
                </PinProvider>
            </CardRegistryProvider>
        </PhysicsProvider>,
    )
}

describe('Home — v2 populated landing pageDef', () => {
    test('rests populated with up gravity (balloons) and no v1 cards', () => {
        expect(pageDef.gravity).toBe('up')
        expect(pageDef.resting).toBe('populated')
        expect(pageDef.cards).toHaveLength(0)
    })
})

describe('Home — render', () => {
    test('mounts without throwing', () => {
        expect(() => renderHome()).not.toThrow()
    })

    test('renders the section ladder-links as Portals', () => {
        const { container } = renderHome()
        const portals = Array.from(
            container.querySelectorAll('a[data-link-type="portal"]'),
        ).map((a) => a.getAttribute('href'))
        expect(portals).toEqual(
            expect.arrayContaining(['/blog', '/stuff', '/lifelog']),
        )
    })
})
