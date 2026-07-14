import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
    throw new Error('render-phase boom')
}

describe('ErrorBoundary', () => {
    test('renders children when nothing throws', () => {
        render(
            <ErrorBoundary fallback={<span>fallback</span>}>
                <span>content</span>
            </ErrorBoundary>,
        )
        expect(screen.getByText('content')).toBeInTheDocument()
        expect(screen.queryByText('fallback')).not.toBeInTheDocument()
    })

    test('shows the fallback and calls onError when a child throws at render', () => {
        // React logs the caught error to console.error; silence it so the gate
        // output stays clean without hiding the assertion.
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const onError = vi.fn()
        render(
            <ErrorBoundary fallback={<span>fallback</span>} onError={onError}>
                <Boom />
            </ErrorBoundary>,
        )
        expect(screen.getByText('fallback')).toBeInTheDocument()
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0]![0]).toBeInstanceOf(Error)
        spy.mockRestore()
    })
})
