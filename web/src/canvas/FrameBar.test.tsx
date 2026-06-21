import { describe, test, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FrameBar } from './FrameBar'
import { getFrameEdgeController } from './useFrameEdge'
import { PinProvider, usePin } from '../pin/PinContext'
import { saveRoute } from '../pin/pinPersistence'
import type { PinStore } from '../pin/PinStore'

// Default to /blog: per issue #148, FrameBar self-suppresses at `/`
// (placeholder route). Tests that need to inspect FrameBar internals must
// render under a path where it actually mounts.
function renderInRouter(initialPath = '/blog') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <FrameBar />
        </MemoryRouter>,
    )
}

describe('FrameBar', () => {
    test('renders site name "chaipalaka" as a link to /', () => {
        renderInRouter()
        const link = screen.getByRole('link', { name: 'chaipalaka' })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/')
    })

    test('FrameBar self-suppresses at / (placeholder route, issue #148)', () => {
        const { container } = renderInRouter('/')
        expect(container).toBeEmptyDOMElement()
    })

    test('site-name link is NOT active when at /blog', () => {
        renderInRouter('/blog')
        expect(screen.getByRole('link', { name: 'chaipalaka' })).toHaveAttribute(
            'data-active',
            'false',
        )
    })

    test('home nav link is not rendered (site name handles home navigation)', () => {
        renderInRouter()
        expect(screen.queryByRole('link', { name: 'home' })).not.toBeInTheDocument()
    })

    test('shows current pathname in the current-page indicator', () => {
        renderInRouter('/blog')
        expect(screen.getByText('/blog')).toBeInTheDocument()
    })

    // Regression, task-015: Caddy 308-redirects /stuff -> /stuff/, but the
    // SSG HTML bakes the slash-less route path into the indicator. The
    // rendered text must be identical for both forms or hydration fails
    // with React #418.
    test('trailing-slash pathname renders without the slash (task-015)', () => {
        renderInRouter('/stuff/')
        expect(screen.getByText('/stuff')).toBeInTheDocument()
        expect(screen.queryByText('/stuff/')).not.toBeInTheDocument()
    })

    test('nav link is active at a trailing-slash URL', () => {
        renderInRouter('/blog/')
        expect(screen.getByRole('link', { name: 'blog' })).toHaveAttribute(
            'data-active',
            'true',
        )
    })

    test('blog nav link is active when at /blog', () => {
        renderInRouter('/blog')
        const link = screen.getByRole('link', { name: 'blog' })
        expect(link).toHaveAttribute('data-active', 'true')
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

    test('/portfolio nav button is NOT rendered', () => {
        renderInRouter()
        expect(screen.queryByRole('link', { name: 'portfolio' })).not.toBeInTheDocument()
    })

    test('/stuff nav link is rendered', () => {
        renderInRouter()
        expect(screen.getByRole('link', { name: 'stuff' })).toBeInTheDocument()
    })

    test('stuff nav link is active when at /stuff/flash', () => {
        renderInRouter('/stuff/flash')
        expect(screen.getByRole('link', { name: 'stuff' })).toHaveAttribute('data-active', 'true')
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

    test('background select has scene options', async () => {
        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        const select = screen.getByRole('combobox', { name: 'Background' })
        const options = Array.from(select.querySelectorAll('option')).map(
            (o) => (o as HTMLOptionElement).value,
        )
        expect(options).toContain('flow-shader')
        expect(options).toContain('particles-starfield')
        expect(options).toContain('geometric-reaction-diffusion')
        expect(options).toContain('audio-reactive')
    })

    test('changing background select updates the selected value', async () => {
        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        const select = screen.getByRole('combobox', { name: 'Background' }) as HTMLSelectElement
        await userEvent.selectOptions(select, 'particles-starfield')
        expect(select.value).toBe('particles-starfield')
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

    // --- Clear-pinned-cards escape hatch (task-028) --------------------------

    test('"Clear pinned cards" is absent without a PinProvider (v1 canvas layout)', async () => {
        renderInRouter()
        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        expect(
            screen.queryByRole('button', { name: /clear pinned cards/i }),
        ).not.toBeInTheDocument()
    })

    test('"Clear pinned cards" drops live pins and wipes saved state', async () => {
        let store!: PinStore
        function Cap() {
            store = usePin()
            return null
        }
        render(
            <MemoryRouter initialEntries={['/blog']}>
                <PinProvider>
                    <Cap />
                    <FrameBar />
                </PinProvider>
            </MemoryRouter>,
        )
        act(() => {
            store.pin({
                sourceEl: document.createElement('a'),
                kind: 'portal',
                center: { x: 0, y: 0 },
                width: 240,
                height: 130,
                locator: { href: '/blog/x', nth: 0 },
            })
        })
        saveRoute('/blog', [
            {
                locator: { href: '/blog/x', nth: 0 },
                kind: 'portal',
                regime: 'word',
                offset: { dx: 0, dy: 120 },
                width: 240,
                height: 130,
            },
        ])
        expect(store.snapshot()).toHaveLength(1)

        await userEvent.click(screen.getByRole('button', { name: 'Site settings' }))
        await userEvent.click(
            screen.getByRole('button', { name: /clear pinned cards/i }),
        )

        expect(store.snapshot()).toHaveLength(0)
        expect(localStorage.getItem('chaipalaka.pins:/blog')).toBeNull()
    })
})
