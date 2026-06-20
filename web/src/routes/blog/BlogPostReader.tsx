import { useParams } from 'react-router-dom'
import { getPosts } from '../../blog/posts'
import { mdxComponents } from '../../blog/components/mdx-components'
import { ReadingSubstrate } from '../../contentbox/ReadingSubstrate'

const posts = getPosts()

export default function BlogPostReader() {
    const { slug } = useParams<{ slug: string }>()
    const post = posts.find((p) => p.slug === slug)

    if (!post) return null

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
