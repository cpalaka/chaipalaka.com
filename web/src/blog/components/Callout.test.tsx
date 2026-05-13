import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Callout } from './Callout'

describe('Callout', () => {
    test.each(['note', 'warn', 'aside'] as const)(
        'type=%s renders <aside role="note" class="callout callout--%s">',
        (type) => {
            const { container } = render(
                <Callout type={type}>hello</Callout>,
            )
            const aside = container.querySelector('aside')
            expect(aside).toBeTruthy()
            expect(aside?.getAttribute('role')).toBe('note')
            expect(aside?.className).toBe(`callout callout--${type}`)
        },
    )

    test('renders children inside the aside', () => {
        const { container } = render(
            <Callout type="note">
                <p>body text</p>
            </Callout>,
        )
        const aside = container.querySelector('aside')
        expect(aside?.innerHTML).toContain('<p>body text</p>')
    })
})
