import { DEFAULT_CONFIG, type SandboxConfig, type ColorMode, type FrameEdge } from './state'

export function encode(cfg: SandboxConfig): URLSearchParams {
    const p = new URLSearchParams()
    const d = DEFAULT_CONFIG
    if (cfg.colorMode !== d.colorMode) p.set('cm', cfg.colorMode)
    if (cfg.frameEdge !== d.frameEdge) p.set('fe', cfg.frameEdge)
    return p
}

const COLOR_MODES = new Set<ColorMode>(['light', 'dark'])
const FRAME_EDGES = new Set<FrameEdge>(['top', 'bottom'])

function inSet<T>(val: string | null, set: Set<T>, fallback: T): T {
    return val && set.has(val as T) ? (val as T) : fallback
}

export function decode(search: string): SandboxConfig {
    const p = new URLSearchParams(search)
    const d = DEFAULT_CONFIG
    return {
        colorMode: inSet(p.get('cm'), COLOR_MODES, d.colorMode),
        frameEdge: inSet(p.get('fe'), FRAME_EDGES, d.frameEdge),
    }
}
