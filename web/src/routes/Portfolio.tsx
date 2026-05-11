import { PhysicsPage } from '../physics/PhysicsPage'
import type { PageDef } from '../physics/PageDef'
import type { CardContent } from '../physics/PhysicsPage'

const pageDef: PageDef = {
    gravity: 'down',
    cards: [
        { id: 'portfolio-stick', kind: 'portfolio', parent: 'ceiling' },
        { id: 'portfolio-flash', kind: 'portfolio', parent: 'ceiling' },
        { id: 'portfolio-anim', kind: 'portfolio', parent: 'ceiling' },
        { id: 'portfolio-site', kind: 'portfolio', parent: 'ceiling' },
    ],
}

const cardContent: Record<string, CardContent> = {
    'portfolio-stick': {
        text: 'Stick Figures',
        width: 240,
        height: 160,
        children: (
            <>
                <h2>Stick Figures</h2>
                <p>Flash-era animations — coming soon.</p>
            </>
        ),
    },
    'portfolio-flash': {
        text: 'Flash Shorts',
        width: 240,
        height: 160,
        children: (
            <>
                <h2>Flash Shorts</h2>
                <p>Micro-animations from 2004–2008 — coming soon.</p>
            </>
        ),
    },
    'portfolio-anim': {
        text: 'Motion Studies',
        width: 240,
        height: 160,
        children: (
            <>
                <h2>Motion Studies</h2>
                <p>Easing and physics explorations — coming soon.</p>
            </>
        ),
    },
    'portfolio-site': {
        text: 'This Site',
        width: 240,
        height: 160,
        children: (
            <>
                <h2>This Site</h2>
                <p>
                    A physics-driven personal site — the source is the artifact.
                </p>
            </>
        ),
    },
}

export default function Portfolio() {
    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
