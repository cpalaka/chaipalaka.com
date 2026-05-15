import { useEffect, useMemo, useRef } from 'react'
import { Page } from '../card/Page'
import { useGallery } from '../canvas/useGallery'
import type { PageDef } from './PageDef'
import type { CardContent } from '../card/Page'
import type { CardSpec } from '../physics/PageSpec'

const TEXT = 'chaipalaka.com'

// Letter cards: small squares, one per character.
const LETTER_SIZE = 48
const LETTER_SPACING = 56
const LETTERS_REST_FRAC = 0.4
const LETTERS_JITTER_FRAC = 0.06

// Balloon card: deterministic position, reverse-gravity via balloon buoyancy.
const BALLOON_W = 200
const BALLOON_H = 80
const BALLOON_REST_FRAC = 0.72

// Stable, exported pageDef — the transitions registry in routes/pageDefs.ts
// imports this by reference, so its identity must be module-scoped. Anchor
// rest-y is uniform at LETTERS_REST_FRAC here; the component below substitutes
// per-letter y jitter at runtime so SSR/hydration stays deterministic.
export const pageDef: PageDef = {
    gravity: 'down',
    cards: [
        ...TEXT.split('').map(
            (_ch, i): CardSpec => ({
                id: `letter-${i}`,
                kind: 'headline',
                parent: 'ceiling',
                anchor: (vp) => ({
                    x: vp.width / 2 + (i - (TEXT.length - 1) / 2) * LETTER_SPACING,
                    y: vp.height * LETTERS_REST_FRAC,
                }),
            }),
        ),
        {
            id: 'balloon',
            kind: 'note',
            parent: 'floor',
            anchor: (vp) => ({ x: vp.width / 2, y: vp.height * BALLOON_REST_FRAC }),
        },
    ],
}

const cardContent: Record<string, CardContent> = {
    ...Object.fromEntries(
        TEXT.split('').map((ch, i) => [
            `letter-${i}`,
            {
                text: ch,
                width: LETTER_SIZE,
                height: LETTER_SIZE,
                variant: 'letter',
            },
        ]),
    ),
    balloon: {
        text: 'coming soon',
        width: BALLOON_W,
        height: BALLOON_H,
        variant: 'balloon',
    },
}

export default function Home() {
    const { setActive } = useGallery()
    const setActiveRef = useRef(setActive)
    setActiveRef.current = setActive

    useEffect(() => {
        setActiveRef.current('flow-shader')
    }, [])

    // Jittered tether lengths per page load: a small ± offset on each letter's
    // rest-y. wireTetherFor derives length from distance(parentAnchor, layoutPos),
    // so varying rest-y varies tether length. Computed once on mount so the
    // first paint matches SSR (uniform), then physics settles into the jittered
    // resting positions naturally.
    const runtimePageDef = useMemo<PageDef>(() => {
        let j = 0
        const jitters = pageDef.cards
            .filter((c) => c.id.startsWith('letter-'))
            .map(() => (Math.random() - 0.5) * 2 * LETTERS_JITTER_FRAC)
        return {
            ...pageDef,
            cards: pageDef.cards.map((spec) => {
                if (!spec.id.startsWith('letter-')) return spec
                const dy = jitters[j++] ?? 0
                return {
                    ...spec,
                    anchor: (vp) => {
                        const base = spec.anchor(vp)
                        return {
                            x: base.x,
                            y: vp.height * (LETTERS_REST_FRAC + dy),
                        }
                    },
                }
            }),
        }
    }, [])

    return <Page pageDef={runtimePageDef} cardContent={cardContent} />
}
