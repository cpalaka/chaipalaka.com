import { describe, test, expect } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { PhysicsProvider } from './PhysicsContext'
import { PhysicsPage } from './PhysicsPage'
import { PhysicsLayer } from '../transitions/PhysicsLayer'
import type { PageSpec } from './PageSpec'

const pageDef: PageSpec = {
    gravity: 'down',
    cards: [
        {
            id: 'parent-card',
            kind: 'headline',
            parent: 'ceiling',
            anchor: () => ({ x: 200, y: 100 }),
        },
        {
            id: 'child-card',
            kind: 'note',
            parent: 'parent-card',
            anchor: () => ({ x: 200, y: 300 }),
        },
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
                <PhysicsLayer />
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
