import { describe, test, expect } from 'vitest'
import { detectWebGL, type DocumentLike } from './detect-webgl'

function fakeDoc(getContext: (type: string) => unknown): DocumentLike {
    return {
        createElement: () => ({ getContext }),
    }
}

describe('detectWebGL', () => {
    test('returns true when webgl2 context is available', () => {
        const doc = fakeDoc((type) => (type === 'webgl2' ? {} : null))
        expect(detectWebGL(doc)).toBe(true)
    })

    test('returns true when only legacy webgl context is available', () => {
        const doc = fakeDoc((type) => (type === 'webgl' ? {} : null))
        expect(detectWebGL(doc)).toBe(true)
    })

    test('returns false when neither webgl nor webgl2 is available', () => {
        const doc = fakeDoc(() => null)
        expect(detectWebGL(doc)).toBe(false)
    })

    test('returns false when probing throws (e.g. SecurityError)', () => {
        const doc: DocumentLike = {
            createElement: () => {
                throw new Error('nope')
            },
        }
        expect(detectWebGL(doc)).toBe(false)
    })
})
