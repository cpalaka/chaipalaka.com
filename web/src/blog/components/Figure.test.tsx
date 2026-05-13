import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Figure } from './Figure'

describe('Figure', () => {
    test('renders <figure><img><figcaption>', () => {
        const { container } = render(
            <Figure src="/x.png" caption="cap" />,
        )
        const figure = container.querySelector('figure')
        expect(figure).toBeTruthy()
        expect(figure?.querySelector('img')).toBeTruthy()
        expect(figure?.querySelector('figcaption')).toBeTruthy()
    })

    test('alt provided → img.alt === alt', () => {
        const { container } = render(
            <Figure src="/x.png" caption="cap" alt="explicit alt" />,
        )
        const img = container.querySelector('img') as HTMLImageElement
        expect(img.alt).toBe('explicit alt')
    })

    test('alt absent → img.alt falls back to caption', () => {
        const { container } = render(
            <Figure src="/x.png" caption="cap text" />,
        )
        const img = container.querySelector('img') as HTMLImageElement
        expect(img.alt).toBe('cap text')
    })

    test('credit provided → <span class="figure-credit"> — {credit}</span> inside figcaption', () => {
        const { container } = render(
            <Figure src="/x.png" caption="cap" credit="Photog Name" />,
        )
        const credit = container.querySelector('figcaption .figure-credit')
        expect(credit).toBeTruthy()
        expect(credit?.textContent).toBe(' — Photog Name')
    })

    test('credit absent → no figure-credit span', () => {
        const { container } = render(
            <Figure src="/x.png" caption="cap" />,
        )
        expect(container.querySelector('.figure-credit')).toBeNull()
    })

    test('<img> has loading="lazy"', () => {
        const { container } = render(
            <Figure src="/x.png" caption="cap" />,
        )
        const img = container.querySelector('img') as HTMLImageElement
        expect(img.getAttribute('loading')).toBe('lazy')
    })
})
