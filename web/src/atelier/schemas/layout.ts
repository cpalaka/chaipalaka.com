/**
 * Arrangement-axis schema over a scatter route's RouteLayout — generated at
 * registration from the route's baseline layout (unlike the hand-curated
 * tokens/physics schemas, the field set is per-route: one group per card).
 * Working values convert to/from RouteLayout for the live override and the
 * layout write-back target; `parent: null` (Detached) rides the enum as the
 * string 'detached'.
 *
 * Only fraction-anchor layouts are editable; computed (closure) anchors
 * never appear here because LAYOUT_ROUTES registers pure data layouts only
 * (the / placeholder's letters stay code-edited — spec scope fence).
 */

import type { TuningSchema } from '../../canvas/scenes/paramSchema'
import { lifelogLayout } from '../../routes/Lifelog.layout'
import { stuffLayout } from '../../routes/Stuff.layout'
import type { LayoutCardSpec, RouteLayout } from '../../routes/routeLayout'
import type { Cardinal, CardKind } from '../../physics/PageSpec'
import type { AxisValues } from '../atelierStore'

const CARDINALS = [
    'down',
    'up',
    'left',
    'right',
] as const satisfies readonly Cardinal[]
const CARD_KINDS = [
    'lifelog',
    'blog',
    'portfolio',
    'note',
    'link',
    'headline',
    'nav',
] as const satisfies readonly CardKind[]
// Compile-time exhaustiveness, like the plugin's lists: a new Cardinal or
// CardKind in PageSpec fails typecheck here instead of missing a widget.
const _cardinalsExhaustive: [
    Exclude<Cardinal, (typeof CARDINALS)[number]>,
] extends [never]
    ? true
    : never = true
const _kindsExhaustive: [
    Exclude<CardKind, (typeof CARD_KINDS)[number]>,
] extends [never]
    ? true
    : never = true
void _cardinalsExhaustive
void _kindsExhaustive

/** The enum spelling of `parent: null` — see module doc. */
export const DETACHED = 'detached'

/**
 * Scatter routes whose layout lives in a regenerable `.layout.ts` data
 * file. Keys match the plugin's LAYOUT_TARGETS whitelist; paths are the
 * mounted route paths the panel matches against.
 */
export const LAYOUT_ROUTES: Record<
    string,
    { path: string; layout: RouteLayout }
> = {
    lifelog: { path: '/lifelog', layout: lifelogLayout },
    stuff: { path: '/stuff', layout: stuffLayout },
}

export function routeForPathname(pathname: string): string | null {
    const trimmed =
        pathname.length > 1 && pathname.endsWith('/')
            ? pathname.slice(0, -1)
            : pathname
    for (const [route, def] of Object.entries(LAYOUT_ROUTES)) {
        if (def.path === trimmed) return route
    }
    return null
}

export const layoutAxis = (route: string) => `layout.${route}`

function fractionAnchor(card: LayoutCardSpec): { fx: number; fy: number } {
    if (typeof card.anchor === 'function') {
        throw new Error(
            `layout schema: card "${card.id}" has a computed anchor — not editable`,
        )
    }
    return card.anchor
}

export function layoutSchemaFor(layout: RouteLayout): TuningSchema {
    const ids = layout.cards.map((c) => c.id)
    const schema: TuningSchema = {
        gravity: {
            kind: 'enum',
            default: layout.gravity,
            options: CARDINALS,
            label: 'Gravity',
        },
    }
    for (const card of layout.cards) {
        const anchor = fractionAnchor(card)
        schema[card.id] = {
            kind: 'group',
            label: card.id,
            fields: {
                fx: { kind: 'range', default: anchor.fx, min: 0, max: 1, step: 0.005, label: 'fx' },
                fy: { kind: 'range', default: anchor.fy, min: 0, max: 1, step: 0.005, label: 'fy' },
                parent: {
                    kind: 'enum',
                    default: card.parent ?? DETACHED,
                    options: [
                        'ceiling',
                        'floor',
                        DETACHED,
                        ...ids.filter((id) => id !== card.id),
                    ],
                    label: 'Parent',
                },
                kind: {
                    kind: 'enum',
                    default: card.kind,
                    options: CARD_KINDS,
                    label: 'Kind',
                },
            },
        }
    }
    return schema
}

function cardRecord(values: AxisValues, id: string): AxisValues {
    const record = values[id]
    if (typeof record !== 'object' || record === null) {
        throw new Error(`layout values: missing card group "${id}"`)
    }
    return record as AxisValues
}

/**
 * Working values → RouteLayout, in the baseline layout's card order (the
 * order is not part of the working values; write-back keeps source order).
 */
export function layoutFromValues(
    values: AxisValues,
    baseline: RouteLayout,
): RouteLayout {
    return {
        gravity: values['gravity'] as Cardinal,
        cards: baseline.cards.map((card) => {
            const record = cardRecord(values, card.id)
            const parent = record['parent'] as string
            return {
                id: card.id,
                kind: record['kind'] as CardKind,
                parent: parent === DETACHED ? null : parent,
                anchor: {
                    fx: record['fx'] as number,
                    fy: record['fy'] as number,
                },
            }
        }),
    }
}

/**
 * Transitive children of `cardId` per the WORKING parent values — the
 * mini-inspector excludes these (plus self) from a card's parent options,
 * since the plugin's codegen validation only rejects direct self-parents
 * and an A↔B cycle would otherwise round-trip into source.
 */
export function descendantsOf(
    values: AxisValues,
    layout: RouteLayout,
    cardId: string,
): Set<string> {
    const out = new Set<string>()
    const frontier = [cardId]
    while (frontier.length > 0) {
        const current = frontier.pop()!
        for (const card of layout.cards) {
            if (out.has(card.id) || card.id === cardId) continue
            const record = values[card.id] as AxisValues | undefined
            if (record?.['parent'] === current) {
                out.add(card.id)
                frontier.push(card.id)
            }
        }
    }
    return out
}

export function valuesFromLayout(layout: RouteLayout): AxisValues {
    const values: AxisValues = { gravity: layout.gravity }
    for (const card of layout.cards) {
        const anchor = fractionAnchor(card)
        values[card.id] = {
            fx: anchor.fx,
            fy: anchor.fy,
            parent: card.parent ?? DETACHED,
            kind: card.kind,
        }
    }
    return values
}
