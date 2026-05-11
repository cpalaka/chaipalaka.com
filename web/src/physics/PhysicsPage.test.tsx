import { describe, test, expect } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { PhysicsProvider } from './PhysicsContext'
import { PhysicsPage } from './PhysicsPage'
import type { PageDef } from './PageDef'

const pageDef: PageDef = {
    gravity: 'down',
    cards: [
        { id: 'parent-card', kind: 'headline', parent: 'ceiling' },
        { id: 'child-card', kind: 'note', parent: 'parent-card' },
    ],
}

const cardContent = {
    'parent-card': { text: 'Headline', width: 240, height: 120 },
    'child-card': { text: 'A note', width: 200, height: 100 },
}

describe('PhysicsPage', () => {
    test('renders one DOM card per spec', () => {
        render(
            <PhysicsProvider>
                <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
            </PhysicsProvider>,
        )
        expect(screen.getByText('Headline')).toBeTruthy()
        expect(screen.getByText('A note')).toBeTruthy()
        cleanup()
    })

    test('note kind gets balloon buoyancy — mounts without throwing', () => {
        expect(() =>
            render(
                <PhysicsProvider>
                    <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
                </PhysicsProvider>,
            ),
        ).not.toThrow()
        cleanup()
    })
})
