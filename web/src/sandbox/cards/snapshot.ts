import {
    DEFAULT_CONFIG,
    type SandboxConfig,
    type FlavorKey,
    type FontKey,
    type BorderStyleProp,
    type ShadowStyle,
    type FlourishMode,
    type ResizeMode,
    type FrameEdge,
    type AnimMechanism,
    type ScrollIndicatorStyle,
    type ViewportSim,
    type ColorMode,
} from './state'

// encode SandboxConfig → URL search params
export function encode(cfg: SandboxConfig): URLSearchParams {
    const p = new URLSearchParams()
    const d = DEFAULT_CONFIG
    if (cfg.flavor !== d.flavor) p.set('fl', cfg.flavor)
    if (cfg.borderWidth !== d.borderWidth) p.set('bw', String(cfg.borderWidth))
    if (cfg.borderStyle !== d.borderStyle) p.set('bs', cfg.borderStyle)
    if (cfg.radius !== d.radius) p.set('r', String(cfg.radius))
    if (cfg.shadow !== d.shadow) p.set('sh', cfg.shadow)
    if (cfg.font !== d.font) p.set('fn', cfg.font)
    if (cfg.fontSize !== d.fontSize) p.set('fs', String(cfg.fontSize))
    if (cfg.lineHeight !== d.lineHeight) p.set('lh', String(cfg.lineHeight))
    if (cfg.letterSpacing !== d.letterSpacing)
        p.set('ls', String(cfg.letterSpacing))
    if (cfg.colorMode !== d.colorMode) p.set('cm', cfg.colorMode)
    if (cfg.padding !== d.padding) p.set('pd', String(cfg.padding))
    if (cfg.flourish !== d.flourish) p.set('fo', cfg.flourish)
    if (cfg.resizeMode !== d.resizeMode) p.set('rm', cfg.resizeMode)
    if (cfg.springDuringResize !== d.springDuringResize)
        p.set('sr', cfg.springDuringResize ? '1' : '0')
    if (cfg.snapToGrid !== d.snapToGrid) p.set('sg', cfg.snapToGrid ? '1' : '0')
    if (cfg.frameEdge !== d.frameEdge) p.set('fe', cfg.frameEdge)
    if (cfg.animMechanism !== d.animMechanism) p.set('am', cfg.animMechanism)
    if (cfg.scrollIndicator !== d.scrollIndicator)
        p.set('si', cfg.scrollIndicator)
    if (cfg.viewportSim !== d.viewportSim) p.set('vs', cfg.viewportSim)
    return p
}

const FLAVOR_KEYS = new Set<FlavorKey>(['raw', 'neo', 'swiss', 'nineties'])
const FONT_KEYS = new Set<FontKey>([
    'newsreader',
    'inter',
    'ibm-plex-sans',
    'ibm-plex-mono',
    'jetbrains-mono',
])
const BORDER_STYLES = new Set<BorderStyleProp>([
    'solid',
    'dashed',
    'dotted',
    'double',
])
const SHADOW_STYLES = new Set<ShadowStyle>(['none', 'hard-offset', 'soft'])
const FLOURISH_MODES = new Set<FlourishMode>([
    'off',
    'static-gradient',
    'wavy-edge',
    'noise-field',
])
const RESIZE_MODES = new Set<ResizeMode>(['4-corner', '8-handle'])
const FRAME_EDGES = new Set<FrameEdge>(['top', 'bottom'])
const ANIM_MECHANISMS = new Set<AnimMechanism>(['vt', 'flip'])
const SCROLL_INDICATORS = new Set<ScrollIndicatorStyle>([
    'gradient-fade',
    'dot',
    'arrow',
    'progress-line',
])
const VIEWPORT_SIMS = new Set<ViewportSim>([
    'mobile',
    'tablet',
    'desktop',
    'free',
])
const COLOR_MODES = new Set<ColorMode>(['light', 'dark'])

function inSet<T>(val: string | null, set: Set<T>, fallback: T): T {
    return val && set.has(val as T) ? (val as T) : fallback
}

function numIn<T extends number>(
    val: string | null,
    allowed: T[],
    fallback: T,
): T {
    const n = Number(val)
    return allowed.includes(n as T) ? (n as T) : fallback
}

// decode URL search params → SandboxConfig (unknown/missing params fall back to defaults)
export function decode(search: string): SandboxConfig {
    const p = new URLSearchParams(search)
    const d = DEFAULT_CONFIG
    return {
        flavor: inSet(p.get('fl'), FLAVOR_KEYS, d.flavor),
        borderWidth: numIn(p.get('bw'), [2, 4, 6], d.borderWidth),
        borderStyle: inSet(p.get('bs'), BORDER_STYLES, d.borderStyle),
        radius: numIn(p.get('r'), [0, 2, 4], d.radius),
        shadow: inSet(p.get('sh'), SHADOW_STYLES, d.shadow),
        font: inSet(p.get('fn'), FONT_KEYS, d.font),
        fontSize: numIn(p.get('fs'), [14, 16, 18, 20], d.fontSize),
        lineHeight: numIn(p.get('lh'), [1.3, 1.5, 1.6, 1.8], d.lineHeight),
        letterSpacing: numIn(
            p.get('ls'),
            [-0.01, 0, 0.02, 0.05],
            d.letterSpacing,
        ),
        colorMode: inSet(p.get('cm'), COLOR_MODES, d.colorMode),
        padding: numIn(p.get('pd'), [12, 24, 40], d.padding),
        flourish: inSet(p.get('fo'), FLOURISH_MODES, d.flourish),
        resizeMode: inSet(p.get('rm'), RESIZE_MODES, d.resizeMode),
        springDuringResize:
            p.get('sr') === null ? d.springDuringResize : p.get('sr') === '1',
        snapToGrid:
            p.get('sg') === null ? d.snapToGrid : p.get('sg') === '1',
        frameEdge: inSet(p.get('fe'), FRAME_EDGES, d.frameEdge),
        animMechanism: inSet(p.get('am'), ANIM_MECHANISMS, d.animMechanism),
        scrollIndicator: inSet(
            p.get('si'),
            SCROLL_INDICATORS,
            d.scrollIndicator,
        ),
        viewportSim: inSet(p.get('vs'), VIEWPORT_SIMS, d.viewportSim),
    }
}
