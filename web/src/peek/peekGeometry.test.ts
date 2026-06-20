import { describe, it, expect } from 'vitest'
import { sidePositionFor, pointerBridged } from './peekGeometry'

// A minimal viewport-space rect, like getBoundingClientRect() returns.
function rect(left: number, top: number, width: number, height: number) {
    return { left, top, width, height, right: left + width, bottom: top + height }
}

const VIEWPORT = { width: 1000, height: 800 }
const CARD = { width: 300, height: 160 }
const GAP = 12
const MARGIN = 12

describe('sidePositionFor', () => {
    it('places the card to the right of the word, vertically centred on it', () => {
        const word = rect(100, 400, 60, 20)
        const pos = sidePositionFor(word, CARD, VIEWPORT, GAP, MARGIN)
        expect(pos.side).toBe('right')
        // centre x = word.right + gap + cardW/2
        expect(pos.x).toBe(160 + GAP + 150)
        // centre y = word vertical centre
        expect(pos.y).toBe(410)
    })

    it('flips to the left when the card would overflow the right edge', () => {
        const word = rect(900, 400, 60, 20)
        const pos = sidePositionFor(word, CARD, VIEWPORT, GAP, MARGIN)
        expect(pos.side).toBe('left')
        // centre x = word.left - gap - cardW/2
        expect(pos.x).toBe(900 - GAP - 150)
    })

    it('clamps the card vertically so it never leaves the viewport', () => {
        const nearTop = rect(100, 0, 60, 20)
        const top = sidePositionFor(nearTop, CARD, VIEWPORT, GAP, MARGIN)
        expect(top.y).toBe(MARGIN + CARD.height / 2)

        const nearBottom = rect(100, 790, 60, 20)
        const bottom = sidePositionFor(nearBottom, CARD, VIEWPORT, GAP, MARGIN)
        expect(bottom.y).toBe(VIEWPORT.height - MARGIN - CARD.height / 2)
    })
})

describe('pointerBridged', () => {
    // word on the left; card to its right (left edge at x=200, spanning y 350..470)
    const word = rect(120, 400, 60, 20)
    const card = rect(200, 350, 300, 120)
    const opts = { word, card, side: 'right' as const }

    it('keeps alive while the pointer is over the word', () => {
        expect(pointerBridged({ x: 140, y: 408 }, opts)).toBe(true)
    })

    it('keeps alive while the pointer is over the card', () => {
        expect(pointerBridged({ x: 300, y: 410 }, opts)).toBe(true)
    })

    it('keeps alive in the diagonal gap when the pointer heads toward the card', () => {
        // between word and card, within the triangle to the near corners
        expect(pointerBridged({ x: 190, y: 410 }, opts)).toBe(true)
    })

    it('dismisses when the pointer strays off the path (far above the gap)', () => {
        expect(pointerBridged({ x: 190, y: 200 }, opts)).toBe(false)
    })

    it('flips the triangle when the card is on the left', () => {
        const leftCard = rect(0, 350, 100, 120) // right edge at x=100
        const leftOpts = { word, card: leftCard, side: 'left' as const }
        // in the gap to the left of the word, heading at the card
        expect(pointerBridged({ x: 110, y: 410 }, leftOpts)).toBe(true)
        expect(pointerBridged({ x: 110, y: 200 }, leftOpts)).toBe(false)
    })
})
