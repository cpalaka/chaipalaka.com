import { describe, test, expect } from 'vitest'
import { CANVAS_ONLY_BUNDLE_MARKER } from './canvas-only-marker'

describe('CANVAS_ONLY_BUNDLE_MARKER', () => {
    test('is exported as a string', () => {
        expect(typeof CANVAS_ONLY_BUNDLE_MARKER).toBe('string')
    })

    // The exact value is consumed by src/__tests__/bundle-splitting.test.ts
    // to detect canvas-only code leaking into plain-mode chunks. Changing
    // it would silently break that invariant — pin it here.
    test('has the exact pinned value', () => {
        expect(CANVAS_ONLY_BUNDLE_MARKER).toBe(
            '__CHAIPALAKA_CANVAS_ONLY_BUNDLE_MARKER_4f7c2b9a__',
        )
    })
})
