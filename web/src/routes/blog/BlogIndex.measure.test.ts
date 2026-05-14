import { describe, test, expect } from 'vitest'
import {
    measureBlogCard,
    formatPostDate,
    CARD_GAP,
    CARD_PADDING,
    CARD_PADDING_BOTTOM,
    CARD_HEADER_HEIGHT,
} from './BlogIndex.measure'
import { FONT_CARD_TITLE, type Font } from '../../text/fonts'
import type { PostFrontmatter } from '../../blog/types'

const fixedMeasure = (_text: string, _font: Font, _maxWidth: number) => ({
    width: 100,
    height: 20,
})

const baseFrontmatter: PostFrontmatter = {
    title: 'Hello World',
    description: 'A test post.',
    date: '2026-05-09',
    tags: ['meta', 'web'],
    draft: false,
}

describe('formatPostDate', () => {
    test('formats an ISO date string as readable en-US date', () => {
        expect(formatPostDate('2026-05-09')).toBe('May 9, 2026')
    })
})

describe('measureBlogCard', () => {
    test('width = max part width + 2 * padding', () => {
        const { width } = measureBlogCard(baseFrontmatter, 400, fixedMeasure)
        expect(width).toBe(100 + CARD_PADDING * 2)
    })

    test('height = sum of 5 parts (title+desc+date+tags+cta) + 4 gaps + top + bottom padding + header', () => {
        const { height } = measureBlogCard(baseFrontmatter, 400, fixedMeasure)
        const expectedContent = 5 * 20 + 4 * CARD_GAP
        expect(height).toBe(
            expectedContent + CARD_PADDING + CARD_PADDING_BOTTOM + CARD_HEADER_HEIGHT,
        )
    })

    test('tag-less post omits the tags row — 4 parts + 3 gaps + header', () => {
        const noTags: PostFrontmatter = { ...baseFrontmatter, tags: [] }
        const { height } = measureBlogCard(noTags, 400, fixedMeasure)
        const expectedContent = 4 * 20 + 3 * CARD_GAP
        expect(height).toBe(
            expectedContent + CARD_PADDING + CARD_PADDING_BOTTOM + CARD_HEADER_HEIGHT,
        )
    })

    test('respects maxWidth cap — measure is called with the provided maxWidth', () => {
        const calls: number[] = []
        const spy = (_t: string, _f: Font, mw: number) => {
            calls.push(mw)
            return { width: 50, height: 10 }
        }
        measureBlogCard(baseFrontmatter, 300, spy)
        expect(calls.every((mw) => mw === 300)).toBe(true)
    })

    test('width covers the widest part when parts differ', () => {
        // title uses FONT_CARD_TITLE and is wide; others use FONT_BODY and are narrow
        const spy = (_t: string, font: Font, _mw: number) => {
            return font === FONT_CARD_TITLE
                ? { width: 250, height: 40 }
                : { width: 100, height: 20 }
        }
        const { width } = measureBlogCard(baseFrontmatter, 400, spy)
        expect(width).toBe(250 + CARD_PADDING * 2)
    })
})
