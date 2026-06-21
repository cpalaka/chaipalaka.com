import { useMemo } from 'react'
import { Page, type CardContent } from '../../card/Page'
import { ReadingSubstrate } from '../../contentbox/ReadingSubstrate'
import { CONTENT_BOX_HEIGHT } from '../../contentbox/ContentBox'
import type { PageDef } from '../PageDef'
import type { TocEntry } from '../../blog/types'

// The box is CSS-centred at a fixed size, so its edges sit at the viewport
// centre ± half the box dimensions — the card anchors are derived from that.
const H = CONTENT_BOX_HEIGHT

const toc: TocEntry[] = [
    { depth: 2, text: 'The relocation', slug: 'relocation' },
    { depth: 2, text: 'Three planes of depth', slug: 'planes' },
    { depth: 2, text: 'Edges that hold', slug: 'edges' },
    { depth: 2, text: 'The ladder starts here', slug: 'ladder' },
    { depth: 2, text: 'Two regimes', slug: 'regimes' },
    { depth: 2, text: 'Parking and recall', slug: 'recall' },
]

const cardContent: Record<string, CardContent> = {
    'box-strung': {
        text: 'strung to the box bottom edge',
        width: 200,
        height: 110,
        label: 'strung',
    },
    'box-faller': {
        text: 'dropped onto the box',
        width: 200,
        height: 110,
        label: 'detached',
    },
}

export default function BoxTest() {
    const pageDef = useMemo<PageDef>(
        () => ({
            gravity: 'down',
            cards: [
                {
                    id: 'box-strung',
                    kind: 'link',
                    parent: 'box-bottom',
                    anchor: (vp) => ({
                        x: vp.width / 2,
                        y: vp.height / 2 + H / 2 + 30,
                    }),
                },
                {
                    id: 'box-faller',
                    kind: 'link',
                    parent: null,
                    anchor: (vp) => ({
                        x: vp.width / 2 - 200,
                        y: vp.height / 2 - H / 2 - 120,
                    }),
                },
            ],
        }),
        [],
    )

    return (
        <>
            <ReadingSubstrate title="The content box" toc={toc}>
                <p>
                    v1 treated the whole page as the artifact — a swarm of
                    physics cards over a generative background, where the site
                    itself was the toy. v2 keeps the toy but relocates it from
                    the substrate into the interaction. Each route is now a
                    fixed, readable surface floating over the shader, and the
                    play moves into the act of{' '}
                    <a data-link-type="portal" href="/blog/hello-world">
                        following a link
                    </a>
                    . Pin that link and scroll: its card rides along, then parks
                    at an edge once the word leaves the fold.
                </p>

                <h2 id="relocation">The relocation</h2>
                <p>
                    The reading surface wins. Dense, typography-forward, calm —
                    a column you can actually read, opaque over a moving
                    background so contrast never depends on whatever colour the
                    shader happens to be painting underneath. The toy does not
                    get watered down to pay for this; it just moves up a layer,
                    out of the page and into the act of following a link.
                </p>
                <p>
                    This is the spine slice. It stands the surface up on
                    placeholder styling — the impeccable pass comes last, over
                    the working whole — and proves the one genuinely new
                    mechanism: a reading surface whose edges are part of the
                    simulation without the surface itself being a simulated
                    body.
                </p>

                <h2 id="planes">Three planes of depth</h2>
                <p>
                    Background is the generative shader. The middle plane is
                    this solid box, with the shader visible around it in the
                    margins. The foreground is the cards, free to overlap the
                    box edges so the whole thing reads as having depth rather
                    than being a flat stack of rectangles.
                </p>
                <p>
                    Because the box is opaque and never lets the shader bleed
                    under the text, the reading contrast floor holds in both
                    light and dark themes. The depth comes from solid surfaces
                    and real overlap, not from blur — there is no glassmorphism
                    here, and there is not going to be.
                </p>

                <h2 id="edges">Edges that hold</h2>
                <p>
                    The box is fixed DOM, not a jostleable body — a scrollable
                    reading surface and a tumbling physics object are very
                    nearly contradictions. But its rectangle is pushed into the
                    physics world as four static walls, so a card can land on
                    the top edge, and a card can be strung to the bottom edge
                    and swing there.
                </p>
                <p>
                    When the window resizes, the box recentres and its edge
                    bodies move with it. Anything tethered to an edge is moved
                    by the same amount in the same frame, so the rope it hangs
                    from never snaps taut and flings it across the screen. The
                    edges are viewport-fixed, so scrolling the prose inside the
                    box leaves them exactly where they are.
                </p>

                <h2 id="ladder">The ladder starts here</h2>
                <p>
                    Hover{' '}
                    <a data-link-type="portal" href="/blog/hello-world">
                        the first post
                    </a>{' '}
                    to peek its lead, or{' '}
                    <a data-link-type="portal" href="/blog/draft-second-card">
                        a second piece
                    </a>{' '}
                    beside it — a preview card spawns next to the word and holds
                    still until you move away, when it falls. A footnote
                    <sup>
                        <a href="#user-content-fn-1" id="user-content-fnref-1">
                            1
                        </a>
                    </sup>{' '}
                    is a Pocket: its card is the whole note, with nowhere to enter.
                </p>
                <p>
                    A Portal has somewhere to go. Pin{' '}
                    <a data-link-type="portal" href="/test/box-b">
                        the destination box
                    </a>{' '}
                    and click its card to take the last rung — enter — and watch
                    the card expand and reflow into the page it was previewing.
                </p>
                <p>
                    Not every Portal points inward. Peek{' '}
                    <a
                        data-link-type="external"
                        href="https://gwern.net"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="The reading-craft this redesign borrows from — dense, hover-previewed, link-first."
                    >
                        Gwern&rsquo;s site
                    </a>{' '}
                    — an external link is Portal-shaped but cross-origin, so its
                    card is an authored annotation (note + source) and entering
                    opens the site in a new tab instead of morphing into a box.
                </p>

                <h2 id="regimes">Two regimes</h2>
                <p>
                    A pinned card lives in one of two states. While its source
                    word is on screen it is word-anchored: the rope hangs from
                    the word and the whole card rides the scroll, swinging a
                    little as the column moves. The word itself wobbles, a small
                    transform-only spring, so the bond reads as physical rather
                    than incidental.
                </p>
                <p>
                    The other state is edge-anchored — parked. When the word
                    scrolls out of the box the card cannot sensibly follow it off
                    screen, so it re-homes to the edge the word left through and
                    hangs there, viewport-fixed, waiting. The hand-off is meant
                    to be quiet: the rope re-aims at the edge and settles taut
                    without a lurch.
                </p>

                <h2 id="recall">Parking and recall</h2>
                <p>
                    Parking is automatic and one-way. Recall is not: a parked
                    card never comes back on its own, because a card that
                    yo-yoed across the fold on every small scroll would be
                    unbearable. Instead you scroll the word back into view, where
                    it picks up a distinct, click-suggesting mark, and you click
                    it. The card eases home along its rope.
                </p>
                <p>
                    That asymmetry — leave on a threshold, return on a deliberate
                    click — is the whole trick. It keeps a wall of parked cards
                    from accumulating noise while still making every one of them
                    reachable. Try it: pin{' '}
                    <a data-link-type="portal" href="/blog/draft-second-card">
                        this link
                    </a>
                    , scroll until it parks at the bottom, then scroll back and
                    click the word to bring it home.
                </p>
                <p>
                    None of this is the final look. The surface is placeholder
                    typography on token-separable styling; the one impeccable
                    design pass comes last, over the working whole, so the
                    mechanism is proven before a single colour is chosen.
                </p>

                <div className="pocket-notes">
                    <details
                        className="pocket"
                        data-pocket-id="1"
                        id="user-content-fn-1"
                    >
                        <summary className="pocket__summary">1</summary>
                        <div className="pocket__body">
                            <p>
                                A Pocket has nowhere to step through to — the note
                                itself is the content, lifted from this static
                                disclosure into a preview card on peek. Keep this
                                note, then peek{' '}
                                <a data-link-type="portal" href="/test/box-b">
                                    the destination box
                                </a>{' '}
                                from inside its card to nest one level deeper — a
                                child card strung to this one.
                            </p>
                        </div>
                    </details>
                </div>
            </ReadingSubstrate>
            <Page pageDef={pageDef} cardContent={cardContent} />
        </>
    )
}
