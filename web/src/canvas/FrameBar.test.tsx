import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FrameBar } from './FrameBar'

function renderInRouter(initialPath = '/') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <FrameBar />
        </MemoryRouter>,
    )
}

describe('FrameBar', () => {
    test('renders site name "chaipalaka"', () => {
        renderInRouter()
        expect(screen.getByText('chaipalaka')).toBeInTheDocument()
    })

    test('shows current pathname in the current-page indicator', () => {
        renderInRouter('/blog')
        expect(screen.getByText('/blog')).toBeInTheDocument()
    })

    test('no current-page indicator shown at home (/)', () => {
        renderInRouter('/')
        expect(document.querySelector('.frame-bar__current-page')).not.toBeInTheDocument()
    })

    test('blog nav link is active when at /blog', () => {
        renderInRouter('/blog')
        const link = screen.getByRole('link', { name: 'blog' })
        expect(link).toHaveAttribute('data-active', 'true')
    })

    test('home nav link is active when at /', () => {
        renderInRouter('/')
        const link = screen.getByRole('link', { name: 'home' })
        expect(link).toHaveAttribute('data-active', 'true')
    })

    test('home nav link is NOT active when at /blog', () => {
        renderInRouter('/blog')
        const link = screen.getByRole('link', { name: 'home' })
        expect(link).toHaveAttribute('data-active', 'false')
    })

    test('home nav link is NOT active when at /blog/foo (prefix not root)', () => {
        renderInRouter('/blog/foo')
        const link = screen.getByRole('link', { name: 'home' })
        expect(link).toHaveAttribute('data-active', 'false')
    })

    test('settings menu is absent on initial render', () => {
        renderInRouter()
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    test('clicking settings icon opens the dropdown', async () => {
        renderInRouter()
        const btn = screen.getByRole('button', { name: 'Site settings' })
        expect(btn).toHaveAttribute('aria-expanded', 'false')
        await userEvent.click(btn)
        expect(btn).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    test('clicking settings icon again closes the dropdown', async () => {
        renderInRouter()
        const btn = screen.getByRole('button', { name: 'Site settings' })
        await userEvent.click(btn)
        await userEvent.click(btn)
        expect(btn).toHaveAttribute('aria-expanded', 'false')
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    test('minimized strip has aria-live="polite" and is empty', () => {
        renderInRouter()
        const strip = screen.getByRole('region', { name: 'Minimized cards' })
        expect(strip).toHaveAttribute('aria-live', 'polite')
        expect(strip).toBeEmptyDOMElement()
    })

    test('/portfolio nav button is NOT rendered', () => {
        renderInRouter()
        expect(screen.queryByRole('link', { name: 'portfolio' })).not.toBeInTheDocument()
    })

    test('section nav has accessible label', () => {
        renderInRouter()
        expect(screen.getByRole('navigation', { name: 'Section nav' })).toBeInTheDocument()
    })
})
