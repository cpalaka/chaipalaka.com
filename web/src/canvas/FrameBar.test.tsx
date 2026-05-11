import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FrameBar } from './FrameBar'
import { getFrameEdgeController } from './useFrameEdge'
import { useMinimizedRegistry } from './useMinimizedRegistry'

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

    test('settings menu shows three control groups when open', async () => {
        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        expect(screen.getByText('Background')).toBeInTheDocument()
        expect(screen.getByText('Color mode')).toBeInTheDocument()
        expect(screen.getByText('Frame edge')).toBeInTheDocument()
    })

    test('background select has all four scene options', async () => {
        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        const select = screen.getByRole('combobox', { name: 'Background' })
        const options = Array.from(select.querySelectorAll('option')).map(
            (o) => (o as HTMLOptionElement).value,
        )
        expect(options).toContain('flow-shader')
        expect(options).toContain('particles')
        expect(options).toContain('geometric')
        expect(options).toContain('audio-reactive')
    })

    test('changing background select updates the selected value', async () => {
        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        const select = screen.getByRole('combobox', { name: 'Background' }) as HTMLSelectElement
        await userEvent.selectOptions(select, 'particles')
        expect(select.value).toBe('particles')
        // restore
        await userEvent.selectOptions(select, 'flow-shader')
    })

    test('color-mode button toggles document theme', async () => {
        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        const themeBefore = document.documentElement.dataset.theme
        const themeBtn = screen.getByRole('button', {
            name: /light|dark/i,
        })
        await userEvent.click(themeBtn)
        expect(document.documentElement.dataset.theme).not.toBe(themeBefore)
        // restore
        await userEvent.click(themeBtn)
    })

    test('frame-edge select updates the controller edge', async () => {
        const ctrl = getFrameEdgeController()
        const original = ctrl.getEdge()
        const target = original === 'bottom' ? 'top' : 'bottom'

        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        const select = screen.getByRole('combobox', { name: 'Frame edge' }) as HTMLSelectElement
        await userEvent.selectOptions(select, target)
        expect(ctrl.getEdge()).toBe(target)

        // restore
        await userEvent.selectOptions(select, original)
    })

    test('gravity toggle is absent (gravity is always on per ADR 0001)', async () => {
        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        expect(screen.queryByText('Gravity')).not.toBeInTheDocument()
    })

    describe('minimized strip', () => {
        afterEach(() => {
            // Clean up any cards left in the registry between strip tests.
            const reg = useMinimizedRegistry()
            for (const entry of reg.list()) reg.restore(entry.id)
        })

        test('chip appears in strip when a card is minimized', async () => {
            renderInRouter()
            const reg = useMinimizedRegistry()
            reg.minimize('test-card', { label: 'Books', kind: 'lifelog' })
            const chip = await screen.findByRole('button', { name: 'Restore: Books' })
            expect(chip).toBeInTheDocument()
        })

        test('chip is removed from strip when restored', async () => {
            renderInRouter()
            const reg = useMinimizedRegistry()
            reg.minimize('test-card', { label: 'Books', kind: 'lifelog' })
            await screen.findByRole('button', { name: 'Restore: Books' })
            reg.restore('test-card')
            await waitFor(() => {
                expect(screen.queryByRole('button', { name: 'Restore: Books' })).not.toBeInTheDocument()
            })
        })

        test('clicking a chip calls registry.restore with the chip rect', async () => {
            renderInRouter()
            const reg = useMinimizedRegistry()
            reg.minimize('test-card', { label: 'Books', kind: 'lifelog' })
            const chip = await screen.findByRole('button', { name: 'Restore: Books' })
            await userEvent.click(chip)
            // After clicking restore, the chip should be gone and the entry removed.
            expect(reg.list().some((e) => e.id === 'test-card')).toBe(false)
        })

        test('strip aria-live is polite', () => {
            renderInRouter()
            const strip = screen.getByRole('region', { name: 'Minimized cards' })
            expect(strip).toHaveAttribute('aria-live', 'polite')
        })
    })

    test('pressing Esc closes the menu and returns focus to the trigger', async () => {
        renderInRouter()
        const trigger = screen.getByRole('button', { name: 'Site settings' })
        await userEvent.click(trigger)
        expect(screen.getByRole('menu')).toBeInTheDocument()
        await userEvent.keyboard('{Escape}')
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
        expect(document.activeElement).toBe(trigger)
    })

    test('clicking outside the settings container closes the menu', async () => {
        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        expect(screen.getByRole('menu')).toBeInTheDocument()
        // mousedown outside the settings container
        await userEvent.pointer({ target: document.body, keys: '[MouseLeft>]' })
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
})
