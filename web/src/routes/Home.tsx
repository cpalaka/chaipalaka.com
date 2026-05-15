import { useEffect, useMemo, useRef } from 'react'
import { Page } from '../card/Page'
import { useGallery } from '../canvas/useGallery'
import { useTheme } from '../controls/useTheme'
import type { PageDef } from './PageDef'
import type { CardContent } from '../card/Page'
import type { CardSpec } from '../physics/PageSpec'

const TEXT = 'chaipalaka.com'

// Letter cards: small squares, one per character.
const LETTER_SIZE = 48
const LETTER_SPACING = 70
const LETTERS_REST_FRAC = 0.2
// Small ± fraction added to LETTERS_REST_FRAC per letter; keep this low so
// the row reads as a single horizontal band with subtle vertical variance.
const LETTERS_JITTER_FRAC = 0.025
// Each letter spawns off its taut anchor by ±LETTERS_SPAWN_RANGE_PX on
// both axes, so the row visibly settles into place under physics on load
// rather than appearing pre-settled.
const LETTERS_SPAWN_RANGE_PX_X = 30
const LETTERS_SPAWN_RANGE_PX_Y = 10

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
    const { setTheme } = useTheme()
    const setActiveRef = useRef(setActive)
    const setThemeRef = useRef(setTheme)
    setActiveRef.current = setActive
    setThemeRef.current = setTheme

    useEffect(() => {
        setActiveRef.current('flow-shader')
        setThemeRef.current('light')
    }, [])

    // Per-page-load jitter for letters:
    // - rest-y: small ± fraction so tether lengths vary
    //   (wireTetherFor derives length from distance(parentAnchor, layoutPos)).
    // - spawnOffset: ±LETTERS_SPAWN_RANGE_PX on both axes so letters
    //   visibly pendulum-settle into their taut positions rather than
    //   materialising pre-settled.
    // Computed once on mount so SSR's deterministic first paint isn't
    // contradicted by the client's jittered values.
    const runtimePageDef = useMemo<PageDef>(() => {
        const letterCount = pageDef.cards.filter((c) =>
            c.id.startsWith('letter-'),
        ).length
        const jitter = Array.from({ length: letterCount }, () => ({
            dy: (Math.random() - 0.5) * 2 * LETTERS_JITTER_FRAC,
            sx: (Math.random() - 0.5) * 2 * LETTERS_SPAWN_RANGE_PX_X,
            sy: (Math.random() - 0.5) * 2 * LETTERS_SPAWN_RANGE_PX_Y,
        }))
        let j = 0
        return {
            ...pageDef,
            cards: pageDef.cards.map((spec) => {
                if (!spec.id.startsWith('letter-')) return spec
                const { dy, sx, sy } = jitter[j++] ?? { dy: 0, sx: 0, sy: 0 }
                return {
                    ...spec,
                    anchor: (vp) => {
                        const base = spec.anchor(vp)
                        return {
                            x: base.x,
                            y: vp.height * (LETTERS_REST_FRAC + dy),
                        }
                    },
                    spawnOffset: { x: sx, y: sy },
                }
            }),
        }
    }, [])

    return <Page pageDef={runtimePageDef} cardContent={cardContent} />
}
