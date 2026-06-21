import { getPosts } from '../../blog/posts'
import { ReadingSubstrate } from '../../contentbox/ReadingSubstrate'
import './BlogIndex.css'

/**
 * The v2 /blog index: a quiet content-box listing (spec §8) — the reading
 * heartland. Each post title is a **Portal** link, so the link ladder
 * (peek → keep → enter) fires on it inside the content box; the same rendered
 * list is the prerendered no-JS floor (ReadingSubstrate is effect-free). Replaces
 * the v1 paginated physics card-chain (task-026).
 */
const posts = [...getPosts()].sort(
    (a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date),
)

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export default function BlogIndex() {
    return (
        <ReadingSubstrate title="Writing" toc={[]}>
            <ul className="blog-list">
                {posts.map((post) => (
                    <li key={post.slug} className="blog-list__item">
                        <a
                            data-link-type="portal"
                            href={`/blog/${post.slug}`}
                            className="blog-list__title"
                        >
                            {post.frontmatter.title}
                        </a>
                        <time
                            dateTime={post.frontmatter.date}
                            className="blog-list__date"
                        >
                            {formatDate(post.frontmatter.date)}
                        </time>
                        <p className="blog-list__desc">
                            {post.frontmatter.description}
                        </p>
                    </li>
                ))}
            </ul>
        </ReadingSubstrate>
    )
}
