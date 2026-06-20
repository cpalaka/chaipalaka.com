/**
 * Pure viewport-space geometry for the Peek rung: where the preview card sits
 * beside its source word, and the safe-triangle hover-bridge test that keeps it
 * alive while the cursor travels word → card.
 *
 * All coordinates are viewport-space (the frame `getBoundingClientRect` returns)
 * and the returned card position is its CENTRE — matching how a `.physics-card`
 * is painted (`transform: translate(centreX - w/2, centreY - h/2)`).
 */

export interface Box {
    left: number
    top: number
    width: number
    height: number
    right: number
    bottom: number
}

export interface Size {
    width: number
    height: number
}

export interface Viewport {
    width: number
    height: number
}

export interface Point {
    x: number
    y: number
}

export type Side = 'left' | 'right'

export interface SidePosition extends Point {
    side: Side
}

/**
 * Place the preview beside the word — to the right by default, flipped left if
 * the card would overflow the right edge — vertically centred on the word and
 * clamped so it never leaves the viewport.
 */
export function sidePositionFor(
    word: Box,
    card: Size,
    viewport: Viewport,
    gap: number,
    margin: number,
): SidePosition {
    const half = card.width / 2
    const rightCentre = word.right + gap + half
    const side: Side = rightCentre + half + margin > viewport.width ? 'left' : 'right'
    const x = side === 'right' ? rightCentre : word.left - gap - half

    const wordMidY = word.top + word.height / 2
    const minY = margin + card.height / 2
    const maxY = viewport.height - margin - card.height / 2
    const y = Math.max(minY, Math.min(maxY, wordMidY))

    return { x, y, side }
}

function pointInBox(p: Point, box: Box): boolean {
    return p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom
}

function cross(o: Point, a: Point, b: Point): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function pointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
    const d1 = cross(p, a, b)
    const d2 = cross(p, b, c)
    const d3 = cross(p, c, a)
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0
    return !(hasNeg && hasPos)
}

/**
 * The hover-bridge test (spec §4): the preview survives while the pointer is over
 * the word, over the card, or inside the **safe triangle** spanning the word
 * centre to the card's two near corners — "a cursor heading toward the card keeps
 * it alive even off the direct path." Not an invisible rectangle.
 */
export function pointerBridged(
    p: Point,
    opts: { word: Box; card: Box; side: Side },
): boolean {
    const { word, card, side } = opts
    if (pointInBox(p, word)) return true
    if (pointInBox(p, card)) return true
    const apex = { x: word.left + word.width / 2, y: word.top + word.height / 2 }
    const edgeX = side === 'right' ? card.left : card.right
    return pointInTriangle(p, apex, { x: edgeX, y: card.top }, { x: edgeX, y: card.bottom })
}
