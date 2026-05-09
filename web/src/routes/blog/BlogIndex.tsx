import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsCard } from '../../physics/PhysicsCard'
import { cardLayout, type CardSpec, type CardAnchor } from '../../physics/CardLayout'
import { registry as pretextRegistry } from '../../text/registry'
import { getPosts } from '../../blog/posts'

const posts = getPosts()

function buildSpecs(): CardSpec[] {
  return posts.map(post => ({
    id: post.slug,
    text: `${post.frontmatter.title}\n${post.frontmatter.description}`,
    fontKey: 'body',
  }))
}

function computeAnchors(): CardAnchor[] {
  const vp = { width: window.innerWidth, height: window.innerHeight }
  return cardLayout(buildSpecs(), vp, (text, fontKey, maxWidth) =>
    pretextRegistry.measure(text, fontKey, maxWidth),
  )
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
        const post = posts.find(p => p.slug === anchor.id)!
        return (
          <PhysicsCard
            key={anchor.id}
            text={`${post.frontmatter.title}\n${post.frontmatter.description}`}
            fontKey="body"
            maxWidth={anchor.maxWidth}
            anchor={{ x: anchor.x, y: anchor.y }}
          >
            <Link to={`/blog/${post.slug}`} style={{ display: 'contents' }}>
              <h2>{post.frontmatter.title}</h2>
              <p>{post.frontmatter.description}</p>
              <time dateTime={post.frontmatter.date}>
                {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {post.frontmatter.tags.length > 0 && (
                <ul aria-label="tags">
                  {post.frontmatter.tags.map(tag => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
            </Link>
          </PhysicsCard>
        )
      })}
    </>
  )
}
