import { describe, test, expect, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PhysicsProvider, usePhysicsWorld } from '../physics/PhysicsContext'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import { ContentBox } from './ContentBox'

// ContentBox uses useLocation/useViewTransitionState (hero-morph destination
// naming + focus), which need a data router — the kind vite-react-ssg uses.
function renderRouted(node: React.ReactNode) {
    const router = createMemoryRouter(
        [{ path: '/', element: <>{node}</> }],
        { initialEntries: ['/'] },
    )
    return render(<RouterProvider router={router} />)
}

// jsdom/happy-dom give every element a zero rect; give the box a real one so the
// edge bodies it registers are non-degenerate.
beforeAll(() => {
    Element.prototype.getBoundingClientRect = () =>
        ({
            x: 100,
            y: 80,
            width: 680,
            height: 560,
            top: 80,
            left: 100,
            right: 780,
            bottom: 640,
            toJSON: () => ({}),
        }) as DOMRect
})

function renderInWorld(ui: React.ReactNode) {
    let world: PhysicsWorld | undefined
    function Capture() {
        world = usePhysicsWorld()
        return null
    }
    const utils = renderRouted(
        <PhysicsProvider>
            <Capture />
            {ui}
        </PhysicsProvider>,
    )
    return { getWorld: () => world!, ...utils }
}

describe('ContentBox', () => {
    test('renders its children', () => {
        const { getByTestId } = renderInWorld(
            <ContentBox>
                <p data-testid="prose">hi</p>
            </ContentBox>,
        )
        expect(getByTestId('prose')).toBeTruthy()
    })

    test('exposes the [data-content-box] hook', () => {
        const { container } = renderInWorld(
            <ContentBox>
                <p>hi</p>
            </ContentBox>,
        )
        expect(container.querySelector('[data-content-box]')).toBeTruthy()
    })

    test('registers its rectangle as a content box in the physics world on mount', () => {
        const { getWorld } = renderInWorld(
            <ContentBox>
                <p>hi</p>
            </ContentBox>,
        )
        const world = getWorld()
        expect(world.contentBoxTopHandle).toBeDefined()
        expect(world.contentBoxBottomHandle).toBeDefined()
    })

    test('clears the content box on unmount', () => {
        let world: PhysicsWorld | undefined
        function Capture() {
            world = usePhysicsWorld()
            return null
        }
        const { unmount } = renderRouted(
            <PhysicsProvider>
                <Capture />
                <ContentBox>
                    <p>hi</p>
                </ContentBox>
            </PhysicsProvider>,
        )
        expect(world!.contentBoxTopHandle).toBeDefined()
        unmount()
        expect(world!.contentBoxTopHandle).toBeUndefined()
    })
})
