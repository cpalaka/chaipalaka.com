export type FrameEdge = 'top' | 'bottom'
export type ColorMode = 'light' | 'dark'

export interface SandboxConfig {
    colorMode: ColorMode
    frameEdge: FrameEdge
}

export const DEFAULT_CONFIG: SandboxConfig = {
    colorMode: 'dark',
    frameEdge: 'bottom',
}
