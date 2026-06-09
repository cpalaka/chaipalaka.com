import { formatPostDate } from './BlogIndex.measure'
import type { Post } from '../../blog/types'

/**
 * No-JS prose view of the blog index. The live /blog route builds its card
 * chain in an effect from EMPTY_CHAIN, so its prerendered HTML is empty;
 * this renders the same posts as a plain list at SSG time instead.
 *
 * Links target the plain-mode reader (/blog/:slug/read), which prerenders
 * fully — the canvas post route (/blog/:slug) would itself be blank without
 * JS, so it is not a usable no-JS destination.
 */
export function BlogIndexFallback({ posts }: { posts: Post[] }) {
    return (
        <ul className="nojs-fallback__list">
            {posts.map((post) => {
                const fm = post.frontmatter
                return (
                    <li key={post.slug}>
                        <article>
                            <h2>
                                <a href={`/blog/${post.slug}/read`}>
                                    {fm.title}
                                </a>
                            </h2>
                            <p>{fm.description}</p>
                            <time dateTime={fm.date}>
                                {formatPostDate(fm.date)}
                            </time>
                            {fm.tags.length > 0 ? (
                                <p>{fm.tags.join(' · ')}</p>
                            ) : null}
                        </article>
                    </li>
                )
            })}
        </ul>
    )
}
