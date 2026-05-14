import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { NavCardContent } from './NavCardContent'

afterEach(() => {
    cleanup()
})

describe('NavCardContent', () => {
    test('target="prev" renders a button with the previous-section aria-label and glyph', () => {
        const { getByRole } = render(
            <NavCardContent
                target="prev"
                targetSectionIndex={2}
                sectionCount={5}
                onActivate={() => {}}
            />,
        )
        const button = getByRole('button')
        expect(button.tagName).toBe('BUTTON')
        expect(button.getAttribute('type')).toBe('button')
        expect(button.getAttribute('aria-label')).toBe('Previous section, 2 of 5')
        expect(button.textContent).toBe('↑ back')
    })

    test('target="next" renders a button with the next-section aria-label and glyph', () => {
        const { getByRole } = render(
            <NavCardContent
                target="next"
                targetSectionIndex={3}
                sectionCount={5}
                onActivate={() => {}}
            />,
        )
        const button = getByRole('button')
        expect(button.getAttribute('aria-label')).toBe('Next section, 3 of 5')
        expect(button.textContent).toBe('next ↓')
    })

    test('clicking the button calls onActivate exactly once', () => {
        const onActivate = vi.fn()
        const { getByRole } = render(
            <NavCardContent
                target="prev"
                targetSectionIndex={1}
                sectionCount={4}
                onActivate={onActivate}
            />,
        )
        fireEvent.click(getByRole('button'))
        expect(onActivate).toHaveBeenCalledTimes(1)
    })
})
