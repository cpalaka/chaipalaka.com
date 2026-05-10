import * as pretext from '@chenglou/pretext'

export interface FontMetrics {
    family: string
    size: number
    weight: number
    lineHeight: number
}

export interface MeasuredText {
    width: number
    height: number
    lines: number
}

interface RegisteredFont {
    metrics: FontMetrics
    fontString: string
    lineHeightPx: number
}

function toCanvasFontString(m: FontMetrics): string {
    return `${m.weight} ${m.size}px ${m.family}`
}

export class PretextRegistry {
    private fonts = new Map<string, RegisteredFont>()

    register(key: string, metrics: FontMetrics): void {
        this.fonts.set(key, {
            metrics,
            fontString: toCanvasFontString(metrics),
            lineHeightPx: metrics.size * metrics.lineHeight,
        })
    }

    getFont(key: string): string {
        const f = this.fonts.get(key)
        if (!f) throw new Error(`PretextRegistry: unknown font key '${key}'`)
        return f.fontString
    }

    getLineHeight(key: string): number {
        const f = this.fonts.get(key)
        if (!f) throw new Error(`PretextRegistry: unknown font key '${key}'`)
        return f.lineHeightPx
    }

    measure(text: string, key: string, maxWidth: number): MeasuredText {
        const f = this.fonts.get(key)
        if (!f) throw new Error(`PretextRegistry: unknown font key '${key}'`)
        const prepared = pretext.prepareWithSegments(text, f.fontString)
        const { height, lineCount } = pretext.layout(
            prepared,
            maxWidth,
            f.lineHeightPx,
        )
        const { maxLineWidth } = pretext.measureLineStats(prepared, maxWidth)
        return { width: maxLineWidth, height, lines: lineCount }
    }
}
