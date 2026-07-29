/**
 * The site's route set, derived once and consumed twice.
 *
 * The prerender set (`ssgOptions.includedRoutes`) and the sitemap used to be
 * written by hand in two different files, which is how `/lifelog`, `/stuff`,
 * `/stuff/flash` and `/lab` ended up missing from `sitemap.xml` while
 * `/test/*` and `/sandbox/*` shipped as real static directories (task-044).
 * Both now come from the route tree the app actually declares, so adding a
 * route to `App.tsx` is enough to get it prerendered and listed.
 *
 * Dev routes stay reachable in `npm run dev` — they are only dropped from the
 * build (decision O5, `docs/plan/open-questions.md` §T7).
 */

/** Prefixes that exist for development only: never prerendered, never listed. */
export const DEV_ROUTE_PREFIXES = ['/test/', '/sandbox/'] as const

/** Prerendered on purpose, but kept out of the sitemap. */
export const UNLISTED_ROUTES = ['/404'] as const

/** The minimal shape of a react-router route this module needs to walk. */
export interface RouteNode {
    path?: string
    index?: boolean
    children?: RouteNode[]
}

export function isDevRoute(path: string): boolean {
    return DEV_ROUTE_PREFIXES.some(
        (prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix),
    )
}

export function isPublicRoute(path: string): boolean {
    return (
        !isDevRoute(path) &&
        !(UNLISTED_ROUTES as readonly string[]).includes(path)
    )
}

function joinPath(parent: string, child: string): string {
    if (child.startsWith('/')) return child
    return parent === '/' ? `/${child}` : `${parent}/${child}`
}

/** A path is renderable only if every segment is literal. */
function isStatic(path: string): boolean {
    return !path.includes(':') && !path.includes('*')
}

/**
 * Every fully-static path in a route tree, in sorted order.
 *
 * A node yields a page when it is a leaf or when it declares an `index` child
 * — the same rule react-router uses to decide whether the parent path renders
 * on its own. Parameterised (`:slug`) and splat (`*`) segments are dropped:
 * they are expanded from content instead (see `contentRoutes`).
 */
export function collectStaticPaths(routes: readonly RouteNode[]): string[] {
    const out = new Set<string>()

    const walk = (node: Readonly<RouteNode>, parent: string): void => {
        const path = node.path ? joinPath(parent, node.path) : parent
        const children = node.children ?? []
        const rendersItself =
            children.length === 0 || children.some((c) => c.index)

        if (rendersItself && path !== '' && isStatic(path)) out.add(path)
        for (const child of children) {
            if (child.index) continue
            walk(child, path)
        }
    }

    for (const route of routes) walk(route, '')
    return [...out].sort()
}

/** The static routes a visitor (and a crawler) is meant to reach. */
export function publicStaticPaths(routes: readonly RouteNode[]): string[] {
    return collectStaticPaths(routes).filter(isPublicRoute)
}

/** The parameterised routes, expanded from the content that exists. */
export function contentRoutes(
    blogSlugs: string[],
    flashSlugs: string[],
): string[] {
    return [
        ...blogSlugs.flatMap((slug) => [`/blog/${slug}`, `/blog/${slug}/read`]),
        ...flashSlugs.map((slug) => `/stuff/flash/${slug}`),
    ]
}

/** Every URL that belongs in `sitemap.xml`. */
export function sitemapRoutes(
    routes: readonly RouteNode[],
    blogSlugs: string[],
    flashSlugs: string[],
): string[] {
    // No isPublicRoute filter on the content routes: they are always
    // /blog/<slug> or /stuff/flash/<slug>, so they can never be dev-prefixed
    // or /404, and the filter could never remove anything.
    return [
        ...publicStaticPaths(routes),
        ...contentRoutes(blogSlugs, flashSlugs),
    ]
}

/**
 * Every route SSG should prerender: the sitemap set plus the pages that ship
 * but stay unlisted (today, the 404).
 */
export function prerenderRoutes(
    routes: readonly RouteNode[],
    blogSlugs: string[],
    flashSlugs: string[],
): string[] {
    return [
        ...sitemapRoutes(routes, blogSlugs, flashSlugs),
        ...UNLISTED_ROUTES,
    ]
}

/**
 * The form of a route that Caddy actually serves 200 for.
 *
 * `ssgOptions.dirStyle` is `nested`, so every page is emitted as
 * `<route>/index.html` and `file_server` 301s the slash-less URL to the
 * trailing-slash one. A sitemap listing `/blog` therefore advertises a
 * redirect, not a page — so the sitemap lists the destination directly
 * (task-044 review).
 */
export function toCanonicalUrlPath(route: string): string {
    return route.endsWith('/') ? route : `${route}/`
}

/** `sitemap.xml` for a resolved route set. Written by `ssgOptions.onFinished`. */
export function buildSitemap(routes: string[], baseUrl: string): string {
    if (routes.length === 0) {
        // An empty sitemap is well-formed XML and therefore silently passes a
        // "does it parse" check, while telling crawlers the site has no pages.
        // It only ever means the derivation upstream broke.
        throw new Error(
            'buildSitemap: refusing to write an empty sitemap — the route derivation produced no URLs',
        )
    }
    const urls = routes
        .map(
            (route) =>
                `  <url>\n    <loc>${baseUrl}${toCanonicalUrlPath(route)}</loc>\n  </url>`,
        )
        .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}
