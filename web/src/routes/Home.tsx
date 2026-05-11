import { PhysicsPage } from '../physics/PhysicsPage'
import type { PageDef } from '../physics/PageDef'
import type { CardContent } from '../physics/PhysicsPage'

const CARD_W = 280
const CARD_H = 160

const pageDef: PageDef = {
    gravity: 'down',
    cards: [
        {
            id: 'card-a',
            kind: 'headline',
            parent: 'ceiling',
            anchor: (vp) => ({ x: vp.width * 0.3, y: 180 }),
        },
        {
            id: 'card-b',
            kind: 'headline',
            parent: 'ceiling',
            anchor: (vp) => ({ x: vp.width * 0.7, y: 180 }),
        },
    ],
}

const cardContent: Record<string, CardContent> = {
    'card-a': {
        text: 'The quick brown fox jumps over the lazy dog.',
        width: CARD_W,
        height: CARD_H,
        minimizable: true,
        label: 'card-a',
    },
    'card-b': {
        text: 'Pack my box with five dozen liquor jugs.',
        width: CARD_W,
        height: CARD_H,
        minimizable: true,
        label: 'card-b',
    },
}

export default function Home() {
    return <PhysicsPage pageDef={pageDef} cardContent={cardContent} />
}
