import { Page } from '../card/Page'
import type { PageDef } from './PageDef'
import type { CardContent } from '../card/Page'

const CARD_W = 280
const CARD_H = 160

export const pageDef: PageDef = {
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
        label:'card-a',
    },
    'card-b': {
        text: 'Pack my box with five dozen liquor jugs.',
        width: CARD_W,
        height: CARD_H,
        label:'card-b',
    },
}

export default function Home() {
    return <Page pageDef={pageDef} cardContent={cardContent} />
}
