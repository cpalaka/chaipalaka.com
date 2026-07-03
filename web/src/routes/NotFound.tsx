import { Page } from '../card/Page'
import { Link } from 'react-router-dom'
import { getPosts } from '../blog/posts'
import type { PageDef } from './PageDef'
import type { CardContent } from '../card/Page'

const recentPosts = getPosts().slice(0, 3)

export const pageDef: PageDef = {
    // Livelier drift than a reading route — the 404 cards visibly wander
    // ("everything is floating away").
    driftScale: 0.9,
    cards: [
        {
            id: 'notfound-headline',
            kind: 'headline',
            parent: 'floor',
            anchor: (vp) => ({ x: vp.width * 0.5, y: vp.height - 200 }),
        },
        ...recentPosts.map((p, i) => ({
            id: `notfound-blog-${p.slug}`,
            kind: 'blog' as const,
            parent: 'floor' as const,
            anchor: (vp: { width: number; height: number }) => ({
                x: vp.width * (0.25 + i * 0.25),
                y: vp.height - 400,
            }),
        })),
        {
            id: 'notfound-portfolio',
            kind: 'portfolio',
            parent: 'floor',
            anchor: (vp) => ({ x: vp.width * 0.2, y: vp.height - 200 }),
        },
        {
            id: 'notfound-link',
            kind: 'link',
            parent: 'floor',
            anchor: (vp) => ({ x: vp.width * 0.8, y: vp.height - 200 }),
        },
    ],
}

const cardContent: Record<string, CardContent> = {
    'notfound-headline': {
        text: '404 — Page not found',
        width: 320,
        height: 160,
        children: (
            <>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>404</h1>
                <p style={{ margin: '0.5rem 0 0' }}>
                    This page doesn't exist. Everything is floating away.
                </p>
            </>
        ),
    },
    ...Object.fromEntries(
        recentPosts.map((p) => [
            `notfound-blog-${p.slug}`,
            {
                text: p.frontmatter.title,
                width: 240,
                height: 140,
                children: (
                    <>
                        <h2 style={{ margin: 0, fontSize: '1rem' }}>
                            {p.frontmatter.title}
                        </h2>
                        <Link to={`/blog/${p.slug}`} style={{ fontSize: '0.875rem' }}>
                            Read post →
                        </Link>
                    </>
                ),
            } satisfies CardContent,
        ]),
    ),
    'notfound-portfolio': {
        text: 'Stuff',
        width: 200,
        height: 120,
        children: (
            <>
                <h2 style={{ margin: 0, fontSize: '1rem' }}>Stuff</h2>
                <Link to="/stuff" style={{ fontSize: '0.875rem' }}>
                    Browse →
                </Link>
            </>
        ),
    },
    'notfound-link': {
        text: 'Did you mean / ?',
        width: 200,
        height: 100,
        children: (
            <>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Did you mean</p>
                <Link to="/" style={{ fontSize: '0.875rem' }}>
                    Home →
                </Link>
            </>
        ),
    },
}

export default function NotFound() {
    return <Page pageDef={pageDef} cardContent={cardContent} />
}
