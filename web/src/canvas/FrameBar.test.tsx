import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FrameBar } from './FrameBar'
import { getFrameEdgeController } from './useFrameEdge'

// renderInRouter defaults to /blog so path-indicator and nav-active tests have
// a concrete section path. FrameBar now renders on every route including `/`
// (the issue #148 placeholder suppression was removed in task-036).
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

    test('renders the banner with nav at / (placeholder suppression retired, task-036)', () => {
        renderInRouter('/')
        expect(screen.getByRole('banner')).toBeInTheDocument()
        // at home the site name is the active affordance; no path indicator shown
        expect(screen.getByRole('link', { name: 'chaipalaka' })).toHaveAttribute(
            'data-active',
            'true',
        )
        expect(screen.queryByText('/')).not.toBeInTheDocument()
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

    test('no gravity control in FrameBar settings (gravity is a per-route dormant mode, ADR-0010)', async () => {
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
})

// Regression, task-044: Caddy serves the single prerendered `dist/404/index.html`
// at every URL that missed, so the current-page text baked into that file
// ("/404") reaches the browser at, say, `/nope`. React 18 does not patch a
// hydration mismatch — it throws the hydrated root away and re-renders on the
// client, logging #418 — so the shell must hydrate cleanly AND end up showing
// the real URL. Asserting only the first half would be satisfied by deleting
// the indicator, so both are pinned here.
describe('FrameBar — 404 shell hydration (task-044)', () => {
    async function hydrateShellAt(
        prerenderedPath: string,
        servedPath: string,
    ): Promise<{ container: HTMLElement; hydrationErrors: string[] }> {
        const { renderToString } = await import('react-dom/server')
        const { hydrateRoot } = await import('react-dom/client')
        const { act } = await import('react')

        const tree = (path: string) => (
            <MemoryRouter initialEntries={[path]}>
                <FrameBar />
            </MemoryRouter>
        )

        const container = document.createElement('div')
        container.innerHTML = renderToString(tree(prerenderedPath))
        document.body.appendChild(container)

        const hydrationErrors: string[] = []
        const originalError = console.error
        console.error = (...args: unknown[]) => {
            hydrationErrors.push(args.map(String).join(' '))
        }
        try {
            await act(async () => {
                hydrateRoot(container, tree(servedPath))
            })
        } finally {
            console.error = originalError
        }
        return { container, hydrationErrors }
    }

    test('the prerendered shell carries the /404 path', async () => {
        const { renderToString } = await import('react-dom/server')
        const html = renderToString(
            <MemoryRouter initialEntries={['/404']}>
                <FrameBar />
            </MemoryRouter>,
        )
        expect(html).toContain('/404')
    })

    test('hydrating the /404 shell at another URL logs no hydration error', async () => {
        const { hydrationErrors } = await hydrateShellAt('/404', '/nope-12345')
        expect(
            hydrationErrors.filter((e) => /hydrat/i.test(e)),
        ).toEqual([])
    })

    test('and the indicator ends up showing the URL actually visited', async () => {
        const { container } = await hydrateShellAt('/404', '/nope-12345')
        const indicator = container.querySelector('.frame-bar__current-page')
        expect(indicator?.textContent).toBe('/nope-12345')
    })

    test('a normally-prerendered route still hydrates clean and keeps its path', async () => {
        const { container, hydrationErrors } = await hydrateShellAt(
            '/blog',
            '/blog',
        )
        expect(hydrationErrors.filter((e) => /hydrat/i.test(e))).toEqual([])
        expect(
            container.querySelector('.frame-bar__current-page')?.textContent,
        ).toBe('/blog')
    })
})

// Regression, task-044 review: the path indicator was fixed but the nav links
// carry the identical hazard. The 404 shell ships data-active="false" on all
// three; served at /lifelog/nope the client computes "true" for lifelog.
// React does not reconcile attributes during hydration, so this needs the same
// remount the indicator got. Asserting only the shell would be satisfied by
// deleting the highlight, so the working case is pinned too.
describe('FrameBar — nav highlight through the 404 shell (task-044)', () => {
    async function hydrateShellAt(prerenderedPath: string, servedPath: string) {
        const { renderToString } = await import('react-dom/server')
        const { hydrateRoot } = await import('react-dom/client')
        const { act } = await import('react')
        const tree = (path: string) => (
            <MemoryRouter initialEntries={[path]}>
                <FrameBar />
            </MemoryRouter>
        )
        const container = document.createElement('div')
        container.innerHTML = renderToString(tree(prerenderedPath))
        document.body.appendChild(container)
        await act(async () => {
            hydrateRoot(container, tree(servedPath))
        })
        return container
    }

    const activeOf = (c: HTMLElement, href: string) =>
        c.querySelector(`a[href="${href}"]`)?.getAttribute('data-active')

    test('the /404 shell ships every nav link inactive', async () => {
        const { renderToString } = await import('react-dom/server')
        const html = renderToString(
            <MemoryRouter initialEntries={['/404']}>
                <FrameBar />
            </MemoryRouter>,
        )
        expect(html).not.toContain('data-active="true"')
    })

    test('highlights the section when the shell is served under it', async () => {
        const c = await hydrateShellAt('/404', '/lifelog/nope')
        expect(activeOf(c, '/lifelog')).toBe('true')
    })

    test('does not highlight the other sections', async () => {
        const c = await hydrateShellAt('/404', '/lifelog/nope')
        expect(activeOf(c, '/blog')).toBe('false')
        expect(activeOf(c, '/stuff')).toBe('false')
    })

    test('a genuinely unmatched URL highlights nothing', async () => {
        const c = await hydrateShellAt('/404', '/nope-12345')
        for (const href of ['/blog', '/lifelog', '/stuff']) {
            expect(activeOf(c, href)).toBe('false')
        }
    })

    test('a normally-prerendered section route keeps its highlight', async () => {
        const c = await hydrateShellAt('/blog', '/blog')
        expect(activeOf(c, '/blog')).toBe('true')
        expect(activeOf(c, '/lifelog')).toBe('false')
    })
})
