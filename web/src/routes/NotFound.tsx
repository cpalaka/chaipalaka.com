import { PhysicsPage } from '../physics/PhysicsPage'
import { Link } from 'react-router-dom'
import { getPosts } from '../blog/posts'
import type { PageDef } from '../physics/PageDef'
import type { CardContent } from '../physics/PhysicsPage'

const recentPosts = getPosts().slice(0, 3)

const pageDef: PageDef = {
    gravity: 'up',
    cards: [
        { id: 'notfound-headline', kind: 'headline', parent: 'floor' },
        ...recentPosts.map((p) => ({
            id: `notfound-blog-${p.slug}`,
            kind: 'blog' as const,
            parent: 'floor' as const,
        })),
        { id: 'notfound-portfolio', kind: 'portfolio', parent: 'floor' },
        { id: 'notfound-link', kind: 'link', parent: 'floor' },
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
        text: 'Portfolio',
        width: 200,
        height: 120,
        children: (
            <>
                <h2 style={{ margin: 0, fontSize: '1rem' }}>Portfolio</h2>
                <Link to="/portfolio" style={{ fontSize: '0.875rem' }}>
                    Browse work →
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
    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
