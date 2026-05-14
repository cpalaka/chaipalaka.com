import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PhysicsCard } from '../../physics/PhysicsCard'
import { useRegisterPageDef } from '../../transitions/PageDefRegistry'
import { getPosts } from '../../blog/posts'
import { mdxComponents } from '../../blog/components/mdx-components'
import type { PageDef } from '../PageDef'
import './BlogPost.css'

const posts = getPosts()

const CARD_MAX_WIDTH = 720
const CARD_PADDING = 24

interface CardDims {
    anchor: { x: number; y: number }
    w: number
    h: number
}

export default function BlogPost() {
    const { slug } = useParams<{ slug: string }>()
    const post = posts.find((p) => p.slug === slug)
    const [dims, setDims] = useState<CardDims | null>(null)

    const pageDef = useMemo<PageDef>(
        () => ({
            gravity: 'down',
            cards: [
                {
                    id: `post-${slug}`,
                    kind: 'blog',
                    parent: null,
                    anchor: (vp) => ({ x: vp.width / 2, y: vp.height / 2 }),
                },
            ],
        }),
        [slug],
    )
    useRegisterPageDef(pageDef)

    useEffect(() => {
        const update = () => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const w = Math.min(CARD_MAX_WIDTH + CARD_PADDING * 2, vw - 32)
            const h = Math.round(vh * 0.65)
            setDims({ anchor: { x: vw / 2, y: vh / 2 }, w, h })
        }
        update()
        window.addEventListener('resize', update, { passive: true })
        return () => window.removeEventListener('resize', update)
    }, [])

    if (!post || !dims) return null

    const PostContent = post.Component

    return (
        <PhysicsCard
            text={post.frontmatter.title}
            anchor={dims.anchor}
            width={dims.w}
            height={dims.h}
        >
            <div className="blog-post-card">
                <article>
                    <a className="plain-mode-link" href={`/blog/${slug}/read`}>
                        Read in plain mode ↗
                    </a>
                    <h1>{post.frontmatter.title}</h1>
                    <p className="post-meta">
                        <time dateTime={post.frontmatter.date}>
                            {new Date(post.frontmatter.date).toLocaleDateString(
                                'en-US',
                                {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                },
                            )}
                        </time>
                        {post.frontmatter.tags.length > 0 && (
                            <> · {post.frontmatter.tags.join(', ')}</>
                        )}
                    </p>
                    <PostContent components={mdxComponents} />
                </article>
            </div>
        </PhysicsCard>
    )
}
