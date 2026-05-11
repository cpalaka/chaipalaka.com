import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsPage, type CardContent } from '../../physics/PhysicsPage'
import { registry as pretextRegistry } from '../../text/registry'
import { getPosts } from '../../blog/posts'
import {
    measureBlogCard,
    formatPostDate,
    CARD_PADDING,
    type MeasureFn,
} from './BlogIndex.measure'
import type { PageDef, CardSpec } from '../../physics/PageDef'
import type { Post } from '../../blog/types'
import type { Viewport } from '../../physics/PhysicsWorld'

const GUTTER = 16

export const CHAIN_GAP = 60
export const CHAIN_X_FRACTION = 0.5
export const CHAIN_TOP = 80

const posts = getPosts()

export function buildChain(
    postList: Post[],
    vp: Viewport,
    measure: MeasureFn,
): { pageDef: PageDef; cardContent: Record<string, CardContent> } {
    const textMaxWidth = Math.max(1, vp.width * 0.6 - GUTTER * 2 - CARD_PADDING * 2)

    const cards: CardSpec[] = []
    const cardContent: Record<string, CardContent> = {}

    let y = CHAIN_TOP

    for (let i = 0; i < postList.length; i++) {
        const post = postList[i]!
        const { width, height } = measureBlogCard(post.frontmatter, textMaxWidth, measure)

        const capturedY = y + height / 2
        const id = `blog-${post.slug}`

        cards.push({
            id,
            kind: 'blog',
            parent: i === 0 ? 'ceiling' : `blog-${postList[i - 1]!.slug}`,
            anchor: (viewport: Viewport) => ({
                x: viewport.width * CHAIN_X_FRACTION,
                y: capturedY,
            }),
        })

        cardContent[id] = {
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

        y += height + CHAIN_GAP
    }

    return {
        pageDef: { gravity: 'down', cards },
        cardContent,
    }
}

function getViewport(): Viewport {
    return typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1024, height: 768 }
}

const emptyPage: { pageDef: PageDef; cardContent: Record<string, CardContent> } = {
    pageDef: { gravity: 'down', cards: [] },
    cardContent: {},
}

export default function BlogIndex() {
    const [page, setPage] = useState(emptyPage)

    useEffect(() => {
        function update() {
            const vp = getViewport()
            const measure = (text: string, fontKey: string, mw: number) =>
                pretextRegistry.measure(text, fontKey, mw)
            setPage(buildChain(posts, vp, measure))
        }
        update()
        window.addEventListener('resize', update, { passive: true })
        return () => window.removeEventListener('resize', update)
    }, [])

    return <PhysicsPage pageDef={page.pageDef} cardContent={page.cardContent} />
}
