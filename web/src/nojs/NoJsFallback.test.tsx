import { describe, test, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { NoJsFallback } from './NoJsFallback'

describe('NoJsFallback', () => {
    test('marks its container with data-nojs-fallback so CSS can gate it on JS', () => {
        const { container } = render(<NoJsFallback>hello</NoJsFallback>)
        expect(container.querySelector('[data-nojs-fallback]')).not.toBeNull()
    })

    test('renders its children', () => {
        render(
            <NoJsFallback>
                <p>no-script body</p>
            </NoJsFallback>,
        )
        expect(screen.getByText('no-script body')).toBeInTheDocument()
    })

    test('exposes plain-anchor navigation to every canvas section', () => {
        render(<NoJsFallback>x</NoJsFallback>)
        const nav = screen.getByRole('navigation')
        const hrefs = within(nav)
            .getAllByRole('link')
            .map((a) => a.getAttribute('href'))
        expect(hrefs).toEqual(
            expect.arrayContaining(['/', '/blog', '/stuff', '/lifelog']),
        )
    })
})
