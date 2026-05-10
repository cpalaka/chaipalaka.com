export type FlavorKey = 'raw' | 'neo' | 'swiss' | 'nineties'
export type FontKey =
    | 'newsreader'
    | 'inter'
    | 'ibm-plex-sans'
    | 'ibm-plex-mono'
    | 'jetbrains-mono'
export type BorderStyleProp = 'solid' | 'dashed' | 'dotted' | 'double'
export type ShadowStyle = 'none' | 'hard-offset' | 'soft'
export type FlourishMode = 'off' | 'static-gradient' | 'wavy-edge' | 'noise-field'
export type ResizeMode = '4-corner' | '8-handle'
export type FrameEdge = 'top' | 'bottom'
export type AnimMechanism = 'vt' | 'flip'
export type ScrollIndicatorStyle =
    | 'gradient-fade'
    | 'dot'
    | 'arrow'
    | 'progress-line'
export type ViewportSim = 'mobile' | 'tablet' | 'desktop' | 'free'
export type ColorMode = 'light' | 'dark'

export interface SandboxConfig {
    flavor: FlavorKey
    // Border
    borderWidth: 2 | 4 | 6
    borderStyle: BorderStyleProp
    radius: 0 | 2 | 4
    shadow: ShadowStyle
    // Typography
    font: FontKey
    fontSize: 14 | 16 | 18 | 20
    lineHeight: 1.3 | 1.5 | 1.6 | 1.8
    letterSpacing: -0.01 | 0 | 0.02 | 0.05
    // Palette
    colorMode: ColorMode
    // Density
    padding: 12 | 24 | 40
    // Shader flourish
    flourish: FlourishMode
    // Resize
    resizeMode: ResizeMode
    springDuringResize: boolean
    snapToGrid: boolean
    // Frame
    frameEdge: FrameEdge
    // Animation mechanism
    animMechanism: AnimMechanism
    // Scroll indicator
    scrollIndicator: ScrollIndicatorStyle
    // Viewport sim
    viewportSim: ViewportSim
}

export const DEFAULT_CONFIG: SandboxConfig = {
    flavor: 'raw',
    borderWidth: 4,
    borderStyle: 'solid',
    radius: 0,
    shadow: 'hard-offset',
    font: 'inter',
    fontSize: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    colorMode: 'dark',
    padding: 24,
    flourish: 'off',
    resizeMode: '8-handle',
    springDuringResize: false,
    snapToGrid: false,
    frameEdge: 'bottom',
    animMechanism: 'flip',
    scrollIndicator: 'gradient-fade',
    viewportSim: 'free',
}

export const FONT_FAMILIES: Record<FontKey, string> = {
    newsreader: "'Newsreader Variable', ui-serif, Georgia, serif",
    inter: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
    'ibm-plex-sans': "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
    'ibm-plex-mono': "'IBM Plex Mono', ui-monospace, 'SF Mono', monospace",
    'jetbrains-mono':
        "'JetBrains Mono Variable', ui-monospace, 'SF Mono', monospace",
}
