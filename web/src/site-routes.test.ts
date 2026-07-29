import { describe, it, expect } from 'vitest'
import { routes } from './App'
import {
    DEV_ROUTE_PREFIXES,
    UNLISTED_ROUTES,
    buildSitemap,
    toCanonicalUrlPath,
    collectStaticPaths,
    contentRoutes,
    isDevRoute,
    isPublicRoute,
    prerenderRoutes,
    publicStaticPaths,
    sitemapRoutes,
} from './site-routes'

describe('isDevRoute', () => {
    it.each(['/test/canvas', '/test/box', '/sandbox/cards', '/sandbox/scenes/x'])(
        'treats %s as a dev route',
        (p) => {
            expect(isDevRoute(p)).toBe(true)
        },
    )

    it.each(['/', '/lab', '/blog', '/stuff', '/stuff/flash', '/lifelog'])(
        'treats %s as a real route',
        (p) => {
            expect(isDevRoute(p)).toBe(false)
        },
    )

    it('does not match a public route that merely starts with the same letters', () => {
        expect(isDevRoute('/testimonials')).toBe(false)
        expect(isDevRoute('/sandboxing')).toBe(false)
    })
})

describe('isPublicRoute', () => {
    it('excludes dev routes', () => {
        expect(isPublicRoute('/test/box')).toBe(false)
    })

    it('excludes routes that prerender but stay out of the sitemap', () => {
        for (const r of UNLISTED_ROUTES) expect(isPublicRoute(r)).toBe(false)
    })

    it('keeps /lab public (ADR-0011 art surface)', () => {
        expect(isPublicRoute('/lab')).toBe(true)
    })
})

describe('collectStaticPaths', () => {
    it('returns a leaf route path', () => {
        expect(collectStaticPaths([{ path: '/lifelog' }])).toEqual(['/lifelog'])
    })

    it('joins relative child paths onto the parent', () => {
        expect(
            collectStaticPaths([
                {
                    path: '/stuff',
                    children: [{ index: true }, { path: 'flash' }],
                },
            ]),
        ).toEqual(['/stuff', '/stuff/flash'])
    })

    it('joins onto the root without doubling the slash', () => {
        expect(
            collectStaticPaths([
                { path: '/', children: [{ index: true }, { path: 'about' }] },
            ]),
        ).toEqual(['/', '/about'])
    })

    it('drops parameterised and splat segments', () => {
        expect(
            collectStaticPaths([
                {
                    path: '/blog',
                    children: [{ index: true }, { path: ':slug' }],
                },
                { path: '*' },
            ]),
        ).toEqual(['/blog'])
    })

    it('descends through a pathless layout route', () => {
        expect(
            collectStaticPaths([{ children: [{ path: '/deep' }] }]),
        ).toEqual(['/deep'])
    })

    it('does not emit a parent that has children but no index child', () => {
        expect(
            collectStaticPaths([
                { path: '/group', children: [{ path: 'one' }] },
            ]),
        ).toEqual(['/group/one'])
    })

    it('de-duplicates', () => {
        expect(
            collectStaticPaths([{ path: '/dup' }, { path: '/dup' }]),
        ).toEqual(['/dup'])
    })
})

// The point of this module is that the sitemap and the prerender set are
// derived from the SAME route tree the app actually declares, so a route added
// to App.tsx cannot silently go unlisted (task-044 AC#4). These assertions run
// against the real tree, not a fixture.
describe('publicStaticPaths (against the real App.tsx route tree)', () => {
    const paths = publicStaticPaths(routes)

    it.each(['/', '/lifelog', '/stuff', '/stuff/flash', '/blog', '/lab'])(
        'includes %s',
        (p) => {
            expect(paths).toContain(p)
        },
    )

    it('excludes every dev route', () => {
        expect(paths.filter(isDevRoute)).toEqual([])
    })

    it('is exactly the public static route set', () => {
        expect(paths).toEqual([
            '/',
            '/blog',
            '/lab',
            '/lifelog',
            '/stuff',
            '/stuff/flash',
        ])
    })

    it('would surface a newly added public route', () => {
        const withAbout = publicStaticPaths([...routes, { path: '/about' }])
        expect(withAbout).toContain('/about')
    })
})

describe('contentRoutes', () => {
    it('emits both blog surfaces and the flash detail route', () => {
        expect(contentRoutes(['hello'], ['ava'])).toEqual([
            '/blog/hello',
            '/blog/hello/read',
            '/stuff/flash/ava',
        ])
    })
})

describe('sitemapRoutes', () => {
    const urls = sitemapRoutes(routes, ['hello-world'], ['ava', 'counter'])

    it('carries the content routes', () => {
        expect(urls).toContain('/blog/hello-world')
        expect(urls).toContain('/blog/hello-world/read')
        expect(urls).toContain('/stuff/flash/ava')
    })

    it('carries no dev route', () => {
        for (const prefix of DEV_ROUTE_PREFIXES) {
            expect(urls.filter((u) => u.startsWith(prefix))).toEqual([])
        }
    })

    it('does not list the 404', () => {
        expect(urls).not.toContain('/404')
    })
})

describe('prerenderRoutes', () => {
    const paths = prerenderRoutes(routes, ['hello-world'], ['ava'])

    it('adds the 404 so SSG emits a static error page (AC#1)', () => {
        expect(paths).toContain('/404')
    })

    it('is the sitemap set plus the unlisted routes, and nothing else', () => {
        expect(paths).toEqual([
            ...sitemapRoutes(routes, ['hello-world'], ['ava']),
            ...UNLISTED_ROUTES,
        ])
    })

    it('prerenders no dev route', () => {
        expect(paths.filter(isDevRoute)).toEqual([])
    })
})

describe('toCanonicalUrlPath', () => {
    // dirStyle: 'nested' means Caddy 301s /blog -> /blog/, so the slash-less
    // form in a sitemap advertises a redirect rather than a page.
    it('adds the trailing slash Caddy would redirect to', () => {
        expect(toCanonicalUrlPath('/blog')).toBe('/blog/')
        expect(toCanonicalUrlPath('/stuff/flash/ava')).toBe('/stuff/flash/ava/')
    })

    it('leaves the root alone rather than doubling its slash', () => {
        expect(toCanonicalUrlPath('/')).toBe('/')
    })
})

describe('buildSitemap', () => {
    const base = 'https://example.com'

    it('emits one <loc> per route, prefixed with the canonical host', () => {
        const xml = buildSitemap(['/', '/blog'], base)
        expect(xml).toContain(`<loc>${base}/</loc>`)
        expect(xml).toContain(`<loc>${base}/blog/</loc>`)
        expect(xml.match(/<loc>/g) ?? []).toHaveLength(2)
    })

    it('lists every URL in the form the host serves 200 for, not a redirect', () => {
        const xml = buildSitemap(sitemapRoutes(routes, ['hello'], ['ava']), base)
        const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!)
        expect(locs.length).toBeGreaterThan(0)
        expect(locs.filter((l) => !l.endsWith('/'))).toEqual([])
    })

    // An empty sitemap is well-formed XML, so a "does it parse" check passes
    // while the file tells crawlers the site has no pages. The previous test
    // here asserted that empty output was fine, which blessed the failure.
    it('refuses to emit an empty sitemap', () => {
        expect(() => buildSitemap([], base)).toThrow(/empty sitemap/)
    })

    it('lists exactly the derived public route set, and no dev route', () => {
        const derived = sitemapRoutes(
            [{ path: '/' }, { path: '/lab' }, { path: '/test/box' }],
            [],
            [],
        )
        const xml = buildSitemap(derived, base)
        expect(xml).toContain(`<loc>${base}/lab/</loc>`)
        expect(xml).not.toContain('/test/')
    })
})
