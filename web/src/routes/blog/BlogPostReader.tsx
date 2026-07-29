import { Link, useParams } from 'react-router-dom'
import { getPosts } from '../../blog/posts'
import { mdxComponents } from '../../blog/components/mdx-components'
import { ReadingSubstrate } from '../../contentbox/ReadingSubstrate'
import { NOT_FOUND_BODY, NOT_FOUND_TITLE } from '../notFoundCopy'

const posts = getPosts()

export default function BlogPostReader() {
    const { slug } = useParams<{ slug: string }>()
    const post = posts.find((p) => p.slug === slug)

    // An unknown slug still matches this route, so Caddy has already served
    // the prerendered 404 shell and a 404 status — but the client router
    // resolves /blog/<typo> to *this* component. Returning null then left the
    // content box empty, which is how a mistyped post URL rendered a blank
    // page (task-044 review). Say the same thing the bespoke 404 says, as
    // prose: floating cards over an empty box would be the same blank page.
    if (!post) {
        return (
            <ReadingSubstrate title={NOT_FOUND_TITLE} toc={[]}>
                <p>{NOT_FOUND_BODY}</p>
                <p>
                    <Link to="/blog">← All posts</Link>
                    {' · '}
                    <Link to="/">Home</Link>
                </p>
            </ReadingSubstrate>
        )
    }

    const PostContent = post.Component

    const meta = (
        <p className="post-meta">
            <time dateTime={post.frontmatter.date}>
                {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })}
            </time>
            {post.frontmatter.tags.length > 0 && (
                <> · {post.frontmatter.tags.join(', ')}</>
            )}
        </p>
    )

    return (
        <ReadingSubstrate
            title={post.frontmatter.title}
            toc={post.toc}
            meta={meta}
        >
            <PostContent components={mdxComponents} />
        </ReadingSubstrate>
    )
}
