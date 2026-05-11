import { describe, test, expect } from 'vitest'
import { booksAnchor } from './Lifelog'

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
