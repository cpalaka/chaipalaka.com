import { describe, test, expect } from 'vitest'
import { supportsViewTransitions } from './viewTransitions'

// task-019 spike: the fallback decision (AC#2 — unsupported browsers get a
// plain nav, no morph) is the one piece of non-visual logic worth a test.
describe('supportsViewTransitions', () => {
    test('true when startViewTransition is a function', () => {
        expect(
            supportsViewTransitions({ startViewTransition: () => {} }),
        ).toBe(true)
    })

    test('false when the API is absent (unsupported browser → plain nav)', () => {
        expect(supportsViewTransitions({})).toBe(false)
    })

    test('false when there is no document (SSG prerender)', () => {
        expect(supportsViewTransitions(undefined)).toBe(false)
    })
})
