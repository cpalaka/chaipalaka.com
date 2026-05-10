import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsCard } from '../../physics/PhysicsCard'
import {
    cardLayout,
    type CardSpec,
    type CardAnchor,
} from '../../physics/CardLayout'
import { registry as pretextRegistry } from '../../text/registry'
import { getPosts } from '../../blog/posts'
import {
    measureBlogCard,
    formatPostDate,
    CARD_PADDING,
} from './BlogIndex.measure'

const posts = getPosts()

const GUTTER = 16

function colsForWidth(vw: number): number {
    if (vw >= 1024) return 3
    if (vw >= 480) return 2
    return 1
}

function computeAnchors(): CardAnchor[] {
    const vp = { width: window.innerWidth, height: window.innerHeight }
    const numCols = colsForWidth(vp.width)
    const colWidth = vp.width / numCols
    const textMaxWidth = Math.max(1, colWidth - GUTTER * 2 - CARD_PADDING * 2)

    const measure = (text: string, fontKey: string, mw: number) =>
        pretextRegistry.measure(text, fontKey, mw)

    const specs: CardSpec[] = posts.map((post) => {
        const { width, height } = measureBlogCard(
            post.frontmatter,
            textMaxWidth,
            measure,
        )
        return {
            id: post.slug,
            text: post.frontmatter.title,
            fontKey: 'body',
            width,
            height,
        }
    })

    return cardLayout(specs, vp, measure)
}

export default function BlogIndex() {
    const [anchors, setAnchors] = useState<CardAnchor[]>([])

    useEffect(() => {
        setAnchors(computeAnchors())
        const onResize = () => setAnchors(computeAnchors())
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return (
        <>
            {anchors.map((anchor) => {
                const post = posts.find((p) => p.slug === anchor.id)!
                return (
                    <PhysicsCard
                        key={anchor.id}
                        text={post.frontmatter.title}
                        fontKey="body"
                        maxWidth={anchor.maxWidth}
                        anchor={{ x: anchor.x, y: anchor.y }}
                        width={anchor.width}
                        height={anchor.height}
                    >
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
                    </PhysicsCard>
                )
            })}
        </>
    )
}
