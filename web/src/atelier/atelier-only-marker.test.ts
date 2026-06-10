import { describe, test, expect } from 'vitest'
import { ATELIER_ONLY_BUNDLE_MARKER } from './atelier-only-marker'

describe('ATELIER_ONLY_BUNDLE_MARKER', () => {
    test('is exported as a string', () => {
        expect(typeof ATELIER_ONLY_BUNDLE_MARKER).toBe('string')
    })

    // The exact value is consumed by src/__tests__/bundle-splitting.test.ts
    // to detect Atelier code leaking into production chunks. Changing it
    // would silently break that invariant — pin it here.
    test('has the exact pinned value', () => {
        expect(ATELIER_ONLY_BUNDLE_MARKER).toBe(
            '__CHAIPALAKA_ATELIER_ONLY_BUNDLE_MARKER_b81d6e2f__',
        )
    })
})
