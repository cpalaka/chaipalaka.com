import { Page } from '../card/Page'
import { NoJsFallback } from '../nojs/NoJsFallback'
import { AuraLayer } from '../canvas/AuraLayer'
import { labLayout } from './Lab.layout'
import { pageSpecFromLayout } from './routeLayout'
import type { PageDef } from './PageDef'
import type { CardContent } from '../card/Page'

// driftScale is authored here, route-side — never in Lab.layout.ts (D7: the
// Atelier regenerates the layout file whole and would drop it). /lab is a lively
// box-less canvas toy for the metaball auras, so it wants full drift (1).
export const pageDef: PageDef = { ...pageSpecFromLayout(labLayout), driftScale: 1 }

// Uniform placeholder specimens — one plain card per layout id. Built from the
// layout so the content keys can never drift out of sync with the card ids.
const cardContent: Record<string, CardContent> = Object.fromEntries(
    labLayout.cards.map((c) => [c.id, { text: c.id, width: 240, height: 160 }]),
)

export default function Lab() {
    return (
        <>
            <Page pageDef={pageDef} cardContent={cardContent} />
            <AuraLayer />
            <NoJsFallback>
                <h1>Lab</h1>
                <p>An experimental canvas playground. Requires JavaScript.</p>
            </NoJsFallback>
        </>
    )
}
