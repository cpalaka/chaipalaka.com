import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Page, type CardContent } from '../../card/Page'
import { NoJsFallback } from '../../nojs/NoJsFallback'
import { BlogIndexFallback } from './BlogIndexFallback'
import { measure } from '../../text/measure'
import { getPosts } from '../../blog/posts'
import {
    measureBlogCard,
    formatPostDate,
    CARD_PADDING,
    type MeasureFn,
} from './BlogIndex.measure'
import { useHashSection } from './hashSection'
import { edgeToInsets } from '../../physics/PhysicsContext'
import { useFrameEdge } from '../../canvas/useFrameEdge'
import { partitionPageDef } from '../../layout/sectionLayout'
import {
    layoutTuning,
    subscribeLayoutTuning,
} from '../../layout/layoutTuning'
import { NavCardContent } from './NavCardContent'
import type { PageDef } from '../PageDef'
import type { CardSpec } from '../../physics/PageSpec'
import type { Post } from '../../blog/types'
import type { Viewport } from '../../physics/PhysicsWorld'

const GUTTER = 16

export const CHAIN_X_FRACTION = 0.5

const ROUTE_KEY = '/blog'
const T4_DURATION_MS = 700

const posts = getPosts()

interface BuiltChain {
    pageDef: PageDef
    cardContent: Record<string, CardContent>
    heights: Record<string, number>
}

/**
 * Lays out a section's cards top-to-bottom in chain order.
 *   - back-nav (head): pinned at NAV_TOP_INSET below the physics ceiling
 *   - content cards: stack with CHAIN_GAP starting just below back-nav
 *     (or at CHAIN_TOP relative to the ceiling if no back-nav)
 *   - next-nav (tail): hangs from the last content card with CHAIN_GAP
 *     — its trail tether to the floor provides the long "chain continues
 *     below" string, which lengthens or shortens with the chain.
 *
 * `insets` are the physics inset (FrameBar). Anchoring relative to the
 * actual edges (not the window) keeps tether lengths sane.
 */
export function layoutSection(
    cards: readonly CardSpec[],
    heights: Record<string, number>,
    _viewport: Viewport,
    insets: { top: number; bottom: number } = { top: 0, bottom: 0 },
): CardSpec[] {
    const isBackNav = (card: CardSpec, i: number) =>
        i === 0 && card.kind === 'nav'

    const ceilingY = insets.top

    const { chainGap, chainTop, navCardH, navTopInset } = layoutTuning

    const startsWithBackNav = cards.length > 0 && isBackNav(cards[0]!, 0)
    let y = startsWithBackNav
        ? ceilingY + navTopInset + navCardH + chainGap
        : ceilingY + chainTop

    return cards.map((card, i) => {
        let capturedY: number
        if (isBackNav(card, i)) {
            capturedY = ceilingY + navTopInset + navCardH / 2
            y = ceilingY + navTopInset + navCardH + chainGap
        } else {
            const h =
                heights[card.id] ?? (card.kind === 'nav' ? navCardH : 0)
            capturedY = y + h / 2
            y += h + chainGap
        }
        return {
            ...card,
            anchor: (vp: Viewport) => ({
                x: vp.width * CHAIN_X_FRACTION,
                y: capturedY,
            }),
        }
    })
}

export function buildChain(
    postList: Post[],
    vp: Viewport,
    measure: MeasureFn,
): BuiltChain {
    const textMaxWidth = Math.max(1, vp.width * 0.6 - GUTTER * 2 - CARD_PADDING * 2)

    const cards: CardSpec[] = []
    const cardContent: Record<string, CardContent> = {}
    const heights: Record<string, number> = {}

    let y = layoutTuning.chainTop

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

        heights[id] = height
        y += height + layoutTuning.chainGap
    }

    return {
        pageDef: {
            gravity: 'down',
            cards,
            sections: { mode: 'auto-chain' },
        },
        cardContent,
        heights,
    }
}

function getViewport(): Viewport {
    return typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1024, height: 768 }
}

const EMPTY_CHAIN: BuiltChain = {
    pageDef: { gravity: 'down', cards: [], sections: { mode: 'auto-chain' } },
    cardContent: {},
    heights: {},
}

export default function BlogIndex() {
    const [chain, setChain] = useState<BuiltChain>(EMPTY_CHAIN)
    const [viewport, setViewport] = useState<Viewport>(getViewport)
    const { sectionIndex, goToSection } = useHashSection()
    const { edge } = useFrameEdge()
    const insets = useMemo(() => edgeToInsets(edge), [edge])

    useEffect(() => {
        function update() {
            const vp = getViewport()
            setViewport(vp)
            setChain(buildChain(posts, vp, measure))
        }
        update()
        window.addEventListener('resize', update, { passive: true })
        // Atelier chain axis — rebuild + re-partition when a chain-layout
        // constant changes (no-op in prod; nothing ever notifies).
        const unsubscribeTuning = subscribeLayoutTuning(update)
        return () => {
            window.removeEventListener('resize', update)
            unsubscribeTuning()
        }
    }, [])

    const sections = useMemo(
        () => partitionPageDef(chain.pageDef, viewport, ROUTE_KEY, chain.heights),
        [chain, viewport],
    )

    // Clamp to bounds — section count can shrink on resize, leaving the URL
    // pointing past the end. We render the last available section and leave
    // the URL alone so a future resize that grows the count restores it.
    const currentIdx = Math.min(
        Math.max(sectionIndex - 1, 0),
        Math.max(sections.length - 1, 0),
    )
    const current = sections[currentIdx]
    const sectionCount = sections.length

    const sectionPageDef = useMemo<PageDef>(
        () => ({
            gravity: 'down',
            cards: layoutSection(
                current?.chain ?? [],
                chain.heights,
                viewport,
                insets,
            ),
        }),
        [current, chain.heights, viewport, insets],
    )

    const sectionContent = useMemo<Record<string, CardContent>>(() => {
        const out: Record<string, CardContent> = {}
        for (const card of current?.cards ?? []) {
            const content = chain.cardContent[card.id]
            if (content) out[card.id] = content
        }
        for (const nav of current?.navCards ?? []) {
            const isBack = nav.id.includes('-nav-back-')
            // 1-indexed target — back targets currentIdx, next targets currentIdx+2.
            const targetSectionIndex = isBack ? currentIdx : currentIdx + 2
            out[nav.id] = {
                text: isBack ? '↑ back' : 'next ↓',
                width: layoutTuning.navCardW,
                height: layoutTuning.navCardH,
                draggable: false,
                children: (
                    <NavCardContent
                        target={isBack ? 'prev' : 'next'}
                        targetSectionIndex={targetSectionIndex}
                        sectionCount={sectionCount}
                        onActivate={() => goToSection(targetSectionIndex)}
                    />
                ),
            }
        }
        return out
    }, [current, currentIdx, sectionCount, chain.cardContent, goToSection])

    // Keyboard nav — ← / → drive section nav when not typing.
    useEffect(() => {
        function onKeydown(e: KeyboardEvent) {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
            const a = document.activeElement
            const tag = (a as HTMLElement | null)?.tagName ?? ''
            if (
                tag === 'INPUT' ||
                tag === 'TEXTAREA' ||
                tag === 'SELECT' ||
                (a as HTMLElement | null)?.isContentEditable
            ) {
                return
            }
            if (e.key === 'ArrowLeft' && currentIdx > 0) {
                e.preventDefault()
                goToSection(currentIdx) // 1-indexed target = currentIdx
            } else if (
                e.key === 'ArrowRight' &&
                currentIdx < sectionCount - 1
            ) {
                e.preventDefault()
                goToSection(currentIdx + 2) // 1-indexed target = currentIdx + 2
            }
        }
        window.addEventListener('keydown', onKeydown)
        return () => window.removeEventListener('keydown', onKeydown)
    }, [currentIdx, sectionCount, goToSection])

    // Focus follow — after T4 completes, focus the first focusable element
    // in the new section. Skip on initial mount so we don't steal focus on
    // page load.
    const firstMountRef = useRef(true)
    useEffect(() => {
        if (firstMountRef.current) {
            firstMountRef.current = false
            return
        }
        const id = window.setTimeout(() => {
            const root = document.querySelector<HTMLElement>(
                '[data-section-root]',
            )
            const focusable = root?.querySelector<HTMLElement>(
                'a, button, [tabindex]:not([tabindex="-1"])',
            )
            focusable?.focus()
        }, T4_DURATION_MS)
        return () => window.clearTimeout(id)
    }, [sectionIndex])

    return (
        <>
            <div data-section-root>
                <Page pageDef={sectionPageDef} cardContent={sectionContent} />
            </div>
            <NoJsFallback>
                <h1>Blog</h1>
                <BlogIndexFallback posts={posts} />
            </NoJsFallback>
        </>
    )
}
