import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ReadingSubstrate } from './ReadingSubstrate'

const toc = [
    { depth: 2, text: 'First', slug: 'first' },
    { depth: 3, text: 'Nested', slug: 'nested' },
]

function renderSubstrate(props?: Partial<Parameters<typeof ReadingSubstrate>[0]>) {
    return render(
        <ReadingSubstrate title="A Title" toc={toc} {...props}>
            <p data-testid="body">prose</p>
        </ReadingSubstrate>,
    )
}

describe('ReadingSubstrate', () => {
    test('renders the <main class="reader"> reading shell', () => {
        const { container } = renderSubstrate()
        expect(container.querySelector('main.reader')).toBeTruthy()
    })

    test('renders a <nav class="reader__toc"> with one <li data-depth> + <a href="#slug"> per TOC entry', () => {
        const { container } = renderSubstrate()
        const nav = container.querySelector('nav.reader__toc')
        expect(nav).toBeTruthy()
        expect(nav!.getAttribute('aria-label')).toBe('Table of contents')
        const items = nav!.querySelectorAll('li')
        expect(items).toHaveLength(2)
        expect(items[0]!.getAttribute('data-depth')).toBe('2')
        expect(items[0]!.querySelector('a')!.getAttribute('href')).toBe('#first')
        expect(items[1]!.getAttribute('data-depth')).toBe('3')
    })

    test('renders the title as the article <h1>', () => {
        const { container } = renderSubstrate()
        const h1 = container.querySelector('article.reader__body h1')
        expect(h1!.textContent).toBe('A Title')
    })

    test('renders the body children', () => {
        const { queryByTestId } = renderSubstrate()
        expect(queryByTestId('body')).toBeTruthy()
    })

    test('renders the optional meta slot inside the article when provided', () => {
        const { container } = renderSubstrate({
            meta: <p className="post-meta">by line</p>,
        })
        const meta = container.querySelector('article.reader__body .post-meta')
        expect(meta!.textContent).toBe('by line')
    })

    test('omits the meta slot when not provided', () => {
        const { container } = renderSubstrate()
        expect(container.querySelector('article.reader__body .post-meta')).toBeNull()
    })

    test('renders an empty <ol> when the TOC is empty', () => {
        const { container } = render(
            <ReadingSubstrate title="T" toc={[]}>
                <p>x</p>
            </ReadingSubstrate>,
        )
        expect(container.querySelectorAll('nav.reader__toc li')).toHaveLength(0)
    })
})
