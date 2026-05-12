import { describe, test, expect } from 'vitest'
import { booksAnchor, nowPlayingAnchor, filmsAnchor, activityAnchor } from './Lifelog'
import { PhysicsWorld } from '../physics/PhysicsWorld'
import { wireTetherFor } from '../physics/PhysicsCard'

const viewport = { width: 1200, height: 800 }

describe('Lifelog anchor placement', () => {
    test('books card anchors to horizontal center', () => {
        expect(booksAnchor(viewport).x).toBe(viewport.width / 2)
    })

    test('books card anchors at y=200', () => {
        expect(booksAnchor(viewport).y).toBe(200)
    })

    test('books anchor adapts to viewport width', () => {
        const narrow = { width: 800, height: 600 }
        expect(booksAnchor(narrow).x).toBe(400)
    })
})

describe('Lifelog ceiling tethers — issue #72 regression', () => {
    test('each ceiling-strung card has a distinct rope origin matching its own anchor.x', () => {
        const world = new PhysicsWorld({ viewport })
        const cards = [
            { anchor: booksAnchor(viewport), size: { width: 320, height: 280 } },
            { anchor: nowPlayingAnchor(viewport), size: { width: 280, height: 180 } },
            { anchor: filmsAnchor(viewport), size: { width: 320, height: 320 } },
            { anchor: activityAnchor(viewport), size: { width: 280, height: 360 } },
        ]
        for (const c of cards) {
            const h = world.register(c.anchor, c.size)
            wireTetherFor(world, world.ceilingHandle, 'ceiling', h, c.anchor)
        }
        const views = world.getTethers()
        expect(views).toHaveLength(4)
        // Each rope origin sits at (cardAnchor.x, 0) — distinct x per card, all at the ceiling surface.
        for (let i = 0; i < views.length; i++) {
            expect(views[i]!.parentPos.x).toBeCloseTo(cards[i]!.anchor.x, 5)
            expect(views[i]!.parentPos.y).toBeCloseTo(0, 5)
        }
        // Pre-fix bug: every ceiling rope collapsed to viewport.width/2.
        // The issue's specific case is Books (centre) vs Music (right-aligned) — assert they differ.
        const booksView = views[0]!
        const musicView = views[1]!
        expect(booksView.parentPos.x).not.toBeCloseTo(musicView.parentPos.x, 0)
    })
})
