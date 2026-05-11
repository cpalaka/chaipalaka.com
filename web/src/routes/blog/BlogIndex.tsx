import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsPage, type CardContent } from '../../physics/PhysicsPage'
import { registry as pretextRegistry } from '../../text/registry'
import { getPosts } from '../../blog/posts'
import {
    measureBlogCard,
    formatPostDate,
    CARD_PADDING,
} from './BlogIndex.measure'
import type { PageDef } from '../../physics/PageDef'

const GUTTER = 16

const posts = getPosts()

const pageDef: PageDef = {
    gravity: 'down',
    cards: posts.map((post) => ({
        id: `blog-${post.slug}`,
        kind: 'blog' as const,
        parent: 'ceiling' as const,
    })),
}

function colsForWidth(vw: number): number {
    if (vw >= 1024) return 3
    if (vw >= 480) return 2
    return 1
}

function buildCardContent(): Record<string, CardContent> {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const numCols = colsForWidth(vw)
    const colWidth = vw / numCols
    const textMaxWidth = Math.max(1, colWidth - GUTTER * 2 - CARD_PADDING * 2)
    const measure = (text: string, fontKey: string, mw: number) =>
        pretextRegistry.measure(text, fontKey, mw)

    const content: Record<string, CardContent> = {}
    for (const post of posts) {
        const { width, height } = measureBlogCard(
            post.frontmatter,
            textMaxWidth,
            measure,
        )
        content[`blog-${post.slug}`] = {
            text: post.frontmatter.title,
            width,
            height,
            minimizable: true,
            label: post.frontmatter.title,
            children: (
                <>
                    <h2>{post.frontmatter.title}</h2>
                    <p>{post.frontmatter.description}</p>
                    <time dateTime={post.frontmatter.date}>
                        {formatPostDate(post.frontmatter.date)}
                    </time>
                    {post.frontmatter.tags.length > 0 && (
                        <p className="card-tags">
                            {post.frontmatter.tags.join(' · ')}
                        </p>
                    )}
                    <Link
                        to={`/blog/${post.slug}`}
                        className="read-post-link"
                    >
                        Read post →
                    </Link>
                </>
            ),
        }
    }
    return content
}

export default function BlogIndex() {
    const [cardContent, setCardContent] = useState<Record<string, CardContent>>(
        {},
    )

    useEffect(() => {
        function update() {
            setCardContent(buildCardContent())
        }
        update()
        window.addEventListener('resize', update, { passive: true })
        return () => window.removeEventListener('resize', update)
    }, [])

    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
