import type { PostFrontmatter } from '../../blog/types'
import { FONT_BODY, FONT_CARD_TITLE, type Font } from '../../text/fonts'

export type MeasureFn = (
    text: string,
    font: Font,
    maxWidth: number,
) => { width: number; height: number }

/** Gap between flex children inside a card — must match the CSS `gap` in Card.css (--card-gap). */
export const CARD_GAP = 24
/** Horizontal and top padding inside the card — must match the CSS padding in Card.css. */
export const CARD_PADDING = 24
/** Bottom padding — larger than top to give the CTA link more visual breathing room. */
export const CARD_PADDING_BOTTOM = 36
/**
 * Height of the card header bar (when present).
 * Must match [data-card-header] min-height in Card.css.
 * The header has margin-top: -card-padding so it sits inside the top padding, but
 * it still consumes this many px of vertical space before the card body content.
 */
export const CARD_HEADER_HEIGHT = 32

export function formatPostDate(dateStr: string): string {
    // Replace '-' with '/' so Date parses as local midnight, not UTC midnight.
    return new Date(dateStr.replace(/-/g, '/')).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

/**
 * Computes the rendered card dimensions for a blog index card.
 * Parts measured: title (card-title font), description (body), date (body),
 * tags as " · "-joined string (body, omitted when empty), and the "Read post →" CTA (body).
 */
export function measureBlogCard(
    frontmatter: PostFrontmatter,
    maxWidth: number,
    measure: MeasureFn,
): { width: number; height: number } {
    const titleM = measure(frontmatter.title, FONT_CARD_TITLE, maxWidth)
    const descM = measure(frontmatter.description, FONT_BODY, maxWidth)
    const dateM = measure(formatPostDate(frontmatter.date), FONT_BODY, maxWidth)
    const tagsStr = frontmatter.tags.join(' · ')
    const tagsM = tagsStr ? measure(tagsStr, FONT_BODY, maxWidth) : null
    const ctaM = measure('Read post →', FONT_BODY, maxWidth)

    const parts = [titleM, descM, dateM, tagsM, ctaM].filter(
        (p): p is { width: number; height: number } => p !== null,
    )
    const contentH =
        parts.reduce((s, p) => s + p.height, 0) + CARD_GAP * (parts.length - 1)
    const contentW = Math.max(...parts.map((p) => p.width))

    return {
        width: contentW + CARD_PADDING * 2,
        height: contentH + CARD_PADDING + CARD_PADDING_BOTTOM + CARD_HEADER_HEIGHT,
    }
}
