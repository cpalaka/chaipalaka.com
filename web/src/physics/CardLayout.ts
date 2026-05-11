export interface LayoutInput {
    id: string
    text: string
    fontKey: string
    /** Pre-computed card dimensions (including padding) — skips internal measure when provided. */
    width?: number
    height?: number
}

export interface CardAnchor {
    id: string
    x: number
    y: number
    width: number
    height: number
    maxWidth: number
}

export type MeasureFn = (
    text: string,
    fontKey: string,
    maxWidth: number,
) => { width: number; height: number }

const CARD_PADDING = 24
const GUTTER = 16
const TOP_MARGIN = 80

function colsForWidth(viewportWidth: number): number {
    if (viewportWidth >= 1024) return 3
    if (viewportWidth >= 480) return 2
    return 1
}

export function cardLayout(
    specs: LayoutInput[],
    viewport: { width: number; height: number },
    measure: MeasureFn,
): CardAnchor[] {
    const numCols = colsForWidth(viewport.width)
    const colWidth = viewport.width / numCols
    // maxWidth for text content: column width minus gutters and card padding on both sides
    const textMaxWidth = Math.max(1, colWidth - GUTTER * 2 - CARD_PADDING * 2)

    // Track the next y position for each column independently (masonry-style)
    const colY = Array<number>(numCols).fill(TOP_MARGIN)

    return specs.map((spec, i) => {
        const col = i % numCols
        let w: number
        let h: number
        if (spec.width !== undefined && spec.height !== undefined) {
            w = spec.width
            h = spec.height
        } else {
            const measured = measure(spec.text, spec.fontKey, textMaxWidth)
            w = measured.width + CARD_PADDING * 2
            h = measured.height + CARD_PADDING * 2
        }

        const cx = col * colWidth + colWidth / 2
        const cy = colY[col]! + h / 2

        colY[col] = colY[col]! + h + GUTTER

        return {
            id: spec.id,
            x: cx,
            y: cy,
            width: w,
            height: h,
            maxWidth: textMaxWidth,
        }
    })
}
