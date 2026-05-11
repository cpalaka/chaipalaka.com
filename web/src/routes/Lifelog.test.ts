import { describe, test, expect } from 'vitest'
import {
    booksAnchor,
    noteAnchor,
    NOTE_FAN_OFFSET_X,
    NOTE_ROW_STEP_Y,
} from './Lifelog'

const viewport = { width: 1200, height: 800 }
const BOOKS_H = 160

describe('Lifelog note anchor placement', () => {
    test('books card anchors to horizontal center', () => {
        expect(booksAnchor(viewport).x).toBe(viewport.width / 2)
    })

    test('with 2 notes, note[0] is left of Books, note[1] is right', () => {
        const books = booksAnchor(viewport)
        const n0 = noteAnchor(0)(viewport)
        const n1 = noteAnchor(1)(viewport)
        expect(n0.x).toBeLessThan(books.x)
        expect(n1.x).toBeGreaterThan(books.x)
    })

    test('both notes hang below Books', () => {
        const books = booksAnchor(viewport)
        const n0 = noteAnchor(0)(viewport)
        const n1 = noteAnchor(1)(viewport)
        expect(n0.y).toBeGreaterThan(books.y)
        expect(n1.y).toBeGreaterThan(books.y)
    })

    test('vertical gap from Books to first note exceeds BOOKS_H + 60', () => {
        const books = booksAnchor(viewport)
        const n0 = noteAnchor(0)(viewport)
        expect(n0.y - books.y).toBeGreaterThan(BOOKS_H + 60)
    })

    test('note x adapts to viewport width on resize', () => {
        const narrow = { width: 800, height: 600 }
        const n0 = noteAnchor(0)(narrow)
        expect(n0.x).toBe(narrow.width / 2 - NOTE_FAN_OFFSET_X)
    })

    test('notes in row 1 (index 2, 3) are further down than row 0', () => {
        const n0 = noteAnchor(0)(viewport)
        const n2 = noteAnchor(2)(viewport)
        expect(n2.y - n0.y).toBe(NOTE_ROW_STEP_Y)
    })

    test('symmetric fan: note[0] and note[1] are equidistant from books center', () => {
        const books = booksAnchor(viewport)
        const n0 = noteAnchor(0)(viewport)
        const n1 = noteAnchor(1)(viewport)
        expect(Math.abs(n0.x - books.x)).toBe(Math.abs(n1.x - books.x))
    })
})
