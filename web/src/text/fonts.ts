export interface Font {
    family: string
    size: number
    weight: number
    lineHeight: number
}

export const FONT_BODY: Font = {
    family: 'IBM Plex Sans',
    size: 16,
    weight: 400,
    lineHeight: 1.6,
}

export const FONT_MONO: Font = {
    family: 'JetBrains Mono Variable',
    size: 14,
    weight: 400,
    lineHeight: 1.6,
}

export const FONT_CARD_TITLE: Font = {
    family: 'IBM Plex Sans',
    size: 36,
    weight: 600,
    lineHeight: 1.15,
}
