import { describe, test, expect, afterEach, vi } from 'vitest'
import { detectWebGPU } from './detect-webgpu'

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('detectWebGPU', () => {
    test('returns false when navigator is undefined (SSG / non-browser)', async () => {
        vi.stubGlobal('navigator', undefined)
        expect(await detectWebGPU()).toBe(false)
    })

    test('returns false when navigator.gpu is absent', async () => {
        vi.stubGlobal('navigator', {})
        expect(await detectWebGPU()).toBe(false)
    })

    test('returns false when requestAdapter resolves null (no adapter)', async () => {
        vi.stubGlobal('navigator', {
            gpu: { requestAdapter: async () => null },
        })
        expect(await detectWebGPU()).toBe(false)
    })

    test('returns true only when requestAdapter resolves a non-null adapter', async () => {
        vi.stubGlobal('navigator', {
            gpu: { requestAdapter: async () => ({}) },
        })
        expect(await detectWebGPU()).toBe(true)
    })

    test('returns false when requestAdapter throws', async () => {
        vi.stubGlobal('navigator', {
            gpu: {
                requestAdapter: async () => {
                    throw new Error('nope')
                },
            },
        })
        expect(await detectWebGPU()).toBe(false)
    })
})
