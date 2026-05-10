import { useParams } from 'react-router-dom'
import { getPosts } from '../../blog/posts'
import { mdxComponents } from '../../blog/components/mdx-components'
import './BlogPostReader.css'

const posts = getPosts()

export default function BlogPostReader() {
    const { slug } = useParams<{ slug: string }>()
    const post = posts.find((p) => p.slug === slug)

    if (!post) return null

    const PostContent = post.Component

    return (
        <main className="reader">
            <nav className="reader__toc" aria-label="Table of contents">
                <h2>Contents</h2>
                <ol>
                    {post.toc.map((entry) => (
                        <li key={entry.slug} data-depth={entry.depth}>
                            <a href={`#${entry.slug}`}>{entry.text}</a>
                        </li>
                    ))}
                </ol>
            </nav>

            <article className="reader__body">
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
        </main>
    )
}
