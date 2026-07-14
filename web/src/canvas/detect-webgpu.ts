// Minimal shape of the WebGPU entry points this gate probes. `@webgpu/types` is
// not a dependency (tsconfig `types: ["vite/client"]`), so `navigator.gpu` is
// untyped — this keeps the gate typed without pulling in the full lib.
interface GPULike {
    requestAdapter(): Promise<unknown>
}
interface NavigatorGPULike {
    gpu?: GPULike
}

/**
 * WebGPU capability gate (ADR-0009 / task-038 AC#4). Both checks are required:
 * `navigator.gpu` can exist while `requestAdapter()` resolves null (no adapter)
 * or rejects, so a positive result needs a real, non-null adapter. Async and
 * client-only — call it from an effect, never at module scope or during render,
 * so SSG never probes WebGPU. Mirrors detect-webgl.ts's fail-safe-to-false style.
 */
export async function detectWebGPU(): Promise<boolean> {
    if (typeof navigator === 'undefined') return false
    const nav = navigator as Navigator & NavigatorGPULike
    if (!nav.gpu) return false
    try {
        const adapter = await nav.gpu.requestAdapter()
        return adapter !== null
    } catch {
        return false
    }
}
