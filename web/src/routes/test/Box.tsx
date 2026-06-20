import { useMemo } from 'react'
import { Page, type CardContent } from '../../card/Page'
import { useRegisterPageDef } from '../../transitions/PageDefRegistry'
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
    useRegisterPageDef(pageDef)

    return (
        <>
            <ReadingSubstrate title="The content box" toc={toc}>
                <p>
                    v1 treated the whole page as the artifact — a swarm of
                    physics cards over a generative background, where the site
                    itself was the toy. v2 keeps the toy but relocates it from
                    the substrate into the interaction. Each route is now a
                    fixed, readable surface floating over the shader, and the
                    play moves into the links.
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
            </ReadingSubstrate>
            <Page pageDef={pageDef} cardContent={cardContent} />
        </>
    )
}
