import * as pretext from '@chenglou/pretext'
import type { Font } from './fonts'

export interface MeasuredText {
    width: number
    height: number
    lines: number
}

function toCanvasFontString(font: Font): string {
    return `${font.weight} ${font.size}px ${font.family}`
}

export function measure(
    text: string,
    font: Font,
    maxWidth: number,
): MeasuredText {
    const fontString = toCanvasFontString(font)
    const lineHeightPx = font.size * font.lineHeight
    const prepared = pretext.prepareWithSegments(text, fontString)
    const { height, lineCount } = pretext.layout(prepared, maxWidth, lineHeightPx)
    const { maxLineWidth } = pretext.measureLineStats(prepared, maxWidth)
    return { width: maxLineWidth, height, lines: lineCount }
}
