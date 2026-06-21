/**
 * Resolves the content a Peek preview shows, from the static DOM + post index.
 *
 *  - **Portal** (`<a data-link-type="portal" href="/blog/…">`): the lead is the
 *    target post's title + frontmatter description (the one-line summary the spec
 *    calls the transcluded "lead"). Non-blog Portals have no lead → null.
 *  - **Pocket** (`<sup><a href="#user-content-fn-N">`): the whole note, lifted
 *    from the matching `<details class="pocket" data-pocket-id="N">` floor that
 *    `rehype-pocket-footnotes` emitted (task-021).
 */

export interface PortalLead {
    title: string
    description: string
}

interface PostLike {
    slug: string
    title: string
    description: string
}

/** Extract a blog slug from a Portal href, or null if it isn't a /blog/<slug>. */
function slugFromHref(href: string): string | null {
    const path = href.split(/[?#]/)[0] ?? href
    const m = path.match(/^\/blog\/([^/]+)(?:\/(?:read)?)?$/)
    return m?.[1] ?? null
}

export function resolvePortalLead(
    href: string,
    posts: readonly PostLike[],
): PortalLead | null {
    const slug = slugFromHref(href)
    if (!slug) return null
    const post = posts.find((p) => p.slug === slug)
    return post ? { title: post.title, description: post.description } : null
}

/**
 * The attribution label for an **external** annotation card: the target's bare
 * hostname (`https://www.gwern.net/x` → `gwern.net`). External links carry no
 * frontmatter to transclude, so the source line is derived from the URL itself
 * (task-029); the authored note rides the markdown link title. Unparseable hrefs
 * fall back to the raw string.
 */
export function externalSourceLabel(href: string): string {
    try {
        const url = new URL(href.startsWith('//') ? `https:${href}` : href)
        return url.hostname.replace(/^www\./, '')
    } catch {
        return href
    }
}

/** The footnote id behind a Pocket reference href (`#user-content-fn-N` → `N`). */
export function pocketIdFromHref(href: string): string | null {
    const m = href.match(/^#user-content-fn-(.+)$/)
    return m?.[1] ?? null
}

export interface PocketBody {
    /** innerHTML of the `.pocket__body`. Authored repo content (trusted) — the
     * note rendered by the MDX/rehype pipeline, never user input. */
    bodyHtml: string
}

/** Lift a Pocket's note from the static disclosure floor by its `data-pocket-id`. */
export function liftPocketBody(
    pocketId: string,
    root: ParentNode = document,
): PocketBody | null {
    const body = root.querySelector(
        `details.pocket[data-pocket-id="${pocketId}"] .pocket__body`,
    )
    return body ? { bodyHtml: body.innerHTML } : null
}
