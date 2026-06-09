import { useEffect, useMemo, useRef, useState } from 'react'
import { Page } from '../card/Page'
import { NoJsFallback } from '../nojs/NoJsFallback'
import { useGallery } from '../canvas/useGallery'
import { useTheme } from '../controls/useTheme'
import type { PageDef } from './PageDef'
import type { CardContent } from '../card/Page'
import type { CardSpec } from '../physics/PageSpec'

const TEXT = 'chaipalaka.com'

// Letter cards — responsive sizing. On narrow viewports the row would
// otherwise overflow (14 letters × 70 px desktop spacing ≈ 980 px wide),
// so both spacing and per-card size scale down with vp.width. Bounds:
//   spacing — viewport-fit, capped at LETTER_SPACING_MAX
//   size    — fraction of spacing, clamped to [MIN, MAX]
//   font    — proportional to size so the glyph keeps breathing room
const LETTER_SPACING_MAX = 70
const LETTER_SIZE_MAX = 48
const LETTER_SIZE_MIN = 20
const LETTER_SIZE_RATIO = 0.75
const LETTER_FONT_RATIO = 0.5
const LETTER_ROW_H_PADDING = 16

function letterMetrics(vpWidth: number): {
    spacing: number
    size: number
    fontSize: number
} {
    const available = Math.max(0, vpWidth - 2 * LETTER_ROW_H_PADDING)
    const spacing = Math.min(LETTER_SPACING_MAX, available / TEXT.length)
    const size = Math.max(
        LETTER_SIZE_MIN,
        Math.min(LETTER_SIZE_MAX, Math.round(spacing * LETTER_SIZE_RATIO)),
    )
    const fontSize = Math.max(10, Math.round(size * LETTER_FONT_RATIO))
    return { spacing, size, fontSize }
}

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
                    x:
                        vp.width / 2 +
                        (i - (TEXT.length - 1) / 2) * letterMetrics(vp.width).spacing,
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

function buildCardContent(
    letterSize: number,
    letterFontSize: number,
): Record<string, CardContent> {
    return {
        ...Object.fromEntries(
            TEXT.split('').map((ch, i) => [
                `letter-${i}`,
                {
                    text: ch,
                    width: letterSize,
                    height: letterSize,
                    variant: 'letter',
                    style: { fontSize: `${letterFontSize}px` },
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
}

function getInitialVpWidth(): number {
    return typeof window !== 'undefined' ? window.innerWidth : 1024
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

    // Track viewport width so cardContent (which feeds the physics body's
    // width/height) can rescale on resize. Page already listens to resize
    // independently for its own anchor recomputation — having one more
    // listener here is cheap and keeps Home self-contained.
    const [vpWidth, setVpWidth] = useState(getInitialVpWidth)
    useEffect(() => {
        if (typeof window === 'undefined') return
        const onResize = () => setVpWidth(window.innerWidth)
        onResize()
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    const { size: letterSize, fontSize: letterFontSize } = letterMetrics(vpWidth)
    const runtimeCardContent = useMemo(
        () => buildCardContent(letterSize, letterFontSize),
        [letterSize, letterFontSize],
    )

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

    return (
        <>
            <Page pageDef={runtimePageDef} cardContent={runtimeCardContent} />
            <NoJsFallback>
                <h1>chaipalaka.com</h1>
                <p>
                    Personal site of Chaitanya Palaka — a new version is coming
                    soon.
                </p>
            </NoJsFallback>
        </>
    )
}
