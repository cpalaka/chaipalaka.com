import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AtelierGate } from './AtelierGate'

describe('AtelierGate (dev)', () => {
    test('renders the corner toggle; the inspector mounts on first open and collapses on re-toggle', async () => {
        render(<AtelierGate />)

        const toggle = screen.getByRole('button', { name: 'Toggle Atelier' })
        expect(screen.queryByTestId('atelier-panel')).toBeNull()

        fireEvent.click(toggle)
        const panel = await screen.findByTestId('atelier-panel')
        expect(panel.style.display).not.toBe('none')
        // Tokens tab is active by default and renders schema-driven widgets
        expect(screen.getByLabelText(/Border width/)).toBeDefined()

        fireEvent.click(toggle)
        // collapsed, not unmounted — tab/scroll state survives reopening
        expect(screen.getByTestId('atelier-panel').style.display).toBe('none')
    })

    test('tabs switch axes — Physics renders its sliders, Layout is a stub until task-008', async () => {
        render(<AtelierGate />)
        fireEvent.click(screen.getByRole('button', { name: 'Toggle Atelier' }))
        await screen.findByTestId('atelier-panel')

        fireEvent.click(screen.getByRole('tab', { name: 'Physics' }))
        expect(screen.getByRole('button', { name: 'Re-drop' })).toBeDefined()
        expect(screen.getByLabelText(/Gravity/)).toBeDefined()
        expect(screen.getByLabelText(/Stiffness/)).toBeDefined()

        fireEvent.click(screen.getByRole('tab', { name: 'Layout' }))
        expect(screen.getByText(/task-008/)).toBeDefined()
    })
})
