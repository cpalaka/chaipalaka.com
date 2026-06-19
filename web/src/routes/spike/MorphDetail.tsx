import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SPIKE_CARDS } from './data'
import { useAnnounce } from './announcer'

// Static name on the destination hero. The browser matches it against the
// clicked card's name (set during the transition) and morphs one into the other.
const HERO_NAME = 'morph-hero'

export default function MorphDetail() {
    const { id } = useParams()
    const card = SPIKE_CARDS.find((c) => c.id === id)
    const headingRef = useRef<HTMLHeadingElement>(null)
    const announce = useAnnounce()

    useEffect(() => {
        if (!card) return
        // Route-change announcement (preserved across the morph) + focus-follow
        // to the destination content-box heading (mirrors BlogIndex). preventScroll
        // keeps the focus call from fighting the morph animation.
        announce(`${card.title} — detail`)
        headingRef.current?.focus({ preventScroll: true })
    }, [card, announce])

    if (!card) {
        return (
            <p>
                Unknown card.{' '}
                <Link to="/spike/morph" viewTransition>
                    Back to index
                </Link>
            </p>
        )
    }

    return (
        <article
            className="spike-box"
            style={{ viewTransitionName: HERO_NAME }}
        >
            <h1 ref={headingRef} tabIndex={-1} className="spike-box-title">
                {card.title}
            </h1>
            <p className="spike-box-blurb">{card.blurb}</p>
            <p className="spike-box-body">{card.body}</p>
            <Link to="/spike/morph" viewTransition className="spike-back">
                ← Back to index
            </Link>
        </article>
    )
}
