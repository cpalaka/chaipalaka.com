import { describe, test, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CanvasLayout from './CanvasLayout'
import { getFrameEdgeController } from '../canvas/useFrameEdge'

function renderCanvasLayout() {
    return render(
        <MemoryRouter initialEntries={['/']}>
            <CanvasLayout />
        </MemoryRouter>,
    )
}

describe('CanvasLayout frame-edge', () => {
    test('data-frame-edge attribute matches the current edge (default bottom)', () => {
        renderCanvasLayout()
        const wrapper = document.querySelector('[data-layout="canvas"]')
        const currentEdge = getFrameEdgeController().getEdge()
        expect(wrapper).toHaveAttribute('data-frame-edge', currentEdge)
    })

    test('data-frame-edge updates when edge changes', async () => {
        renderCanvasLayout()
        const wrapper = document.querySelector('[data-layout="canvas"]')
        const ctrl = getFrameEdgeController()
        const original = ctrl.getEdge()
        const flipped = original === 'bottom' ? 'top' : 'bottom'

        await act(async () => {
            ctrl.setEdge(flipped)
        })

        expect(wrapper).toHaveAttribute('data-frame-edge', flipped)

        // restore
        await act(async () => {
            ctrl.setEdge(original)
        })
    })
})

describe('CanvasLayout FrameBar presence', () => {
    test('FrameBar is mounted inside CanvasLayout', () => {
        renderCanvasLayout()
        expect(screen.getByRole('banner')).toBeInTheDocument()
        expect(screen.getByText('chaipalaka')).toBeInTheDocument()
    })
})
