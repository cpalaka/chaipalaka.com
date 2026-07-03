import { useEffect, useRef } from 'react'
import { ReadingSubstrate } from '../contentbox/ReadingSubstrate'
import { usePageDef } from '../physics/usePageDef'
import { useAmbientPins } from '../pin/useAmbientPins'
import { useGallery } from '../canvas/useGallery'
import { useTheme } from '../controls/useTheme'
import type { PageDef } from './PageDef'
import type { AmbientPinSpec } from '../pin/ambientPins'

/**
 * The v2 home: a populated bespoke landing (spec §8). It rests POPULATED — a card
 * is already pinned to a section link on arrival (the "ambient teacher", §12),
 * teaching the *keep* rung by example — and uses UP gravity so foreground cards
 * read as balloons (§8). It has no v1 PageDef cards; the only card is the runtime
 * ambient pin. The prose is the no-JS floor (ReadingSubstrate prerenders), so it
 * carries no NoJsFallback. Final look is the capstone pass (task-030); this is the
 * functional landing on token-separable placeholder styling.
 */
export const pageDef: PageDef = {
    gravity: 'up',
    resting: 'populated',
    cards: [],
}

// One ambient pin, strung to the "writing" section link and floating above it
// (balloon, up gravity). Stable module const so the seeding effect runs once.
const AMBIENT: AmbientPinSpec[] = [
    {
        selector: 'a[data-link-type="portal"][href="/blog"]',
        kind: 'portal',
        title: 'Writing',
        lead: 'Essays, notes, and longer pieces — the reading heartland.',
        href: '/blog',
        width: 240,
        height: 130,
        // Authored near-word offset (any direction under drift — no gravity to
        // align to); floats the card up-and-beside its word. Drift + prose repel
        // settle the real pose. S4 polishes it alongside the gravity: drop.
        offset: { x: 40, y: -150 },
    },
]

export default function Home() {
    const { setActive } = useGallery()
    const { setTheme } = useTheme()
    const setActiveRef = useRef(setActive)
    const setThemeRef = useRef(setTheme)
    setActiveRef.current = setActive
    setThemeRef.current = setTheme

    useEffect(() => {
        setActiveRef.current('flow-shader')
        setThemeRef.current('light')
    }, [])

    // Up gravity (balloons) + seed the ambient teacher pin on arrival.
    usePageDef(pageDef)
    useAmbientPins(pageDef.resting, AMBIENT)

    return (
        <ReadingSubstrate title="chaipalaka.com" toc={[]}>
            <p>
                Personal site of Chaitanya Palaka. The new version moves the play
                out of the page and into the act of following a link: hover a
                link to <em>peek</em> it, drag its card loose to <em>keep</em> it
                strung to the word, or click through to <em>enter</em>.
            </p>
            <p>
                Start with the{' '}
                <a data-link-type="portal" href="/blog">
                    writing
                </a>
                , poke around the{' '}
                <a data-link-type="portal" href="/stuff">
                    stuff
                </a>{' '}
                I&rsquo;ve made, or see what I&rsquo;m reading, playing, and
                watching in the{' '}
                <a data-link-type="portal" href="/lifelog">
                    lifelog
                </a>
                .
            </p>
            <p>
                The card already floating here is the ambient teacher — it loaded
                pinned to a word so the <em>keep</em> rung shows itself. Grab its
                title bar to move it, or click its body to follow it through.
            </p>
        </ReadingSubstrate>
    )
}
