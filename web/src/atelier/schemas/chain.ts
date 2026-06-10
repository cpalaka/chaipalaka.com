/**
 * Hand-curated Chain-axis schema over web/src/layout/layoutTuning.ts.
 *
 * Flat — schema keys ARE the layoutTuning keys, so no bindings map (unlike
 * physics, whose panel grouping renames paths). Defaults read from the live
 * layoutTuning import, never copied literals. chainGap's floor is the
 * layout spacing guardrail: parent/child spacing must stay ≥ card height
 * + 60px, because tether lengths derive from the layout — err long.
 */

import { defineTuning } from '../../canvas/scenes/paramSchema'
import { layoutTuning } from '../../layout/layoutTuning'
import type { AxisValues } from '../atelierStore'

export const CHAIN_SCHEMA = defineTuning({
    chainGap: { kind: 'range', default: layoutTuning.chainGap, min: 60, max: 200, step: 5, label: 'Chain gap' },
    chainTop: { kind: 'range', default: layoutTuning.chainTop, min: 20, max: 300, step: 5, label: 'Chain top' },
    navCardW: { kind: 'range', default: layoutTuning.navCardW, min: 100, max: 320, step: 5, label: 'Nav card width' },
    navCardH: { kind: 'range', default: layoutTuning.navCardH, min: 32, max: 120, step: 4, label: 'Nav card height' },
    navTopInset: { kind: 'range', default: layoutTuning.navTopInset, min: 0, max: 120, step: 5, label: 'Nav top inset' },
    navBottomInset: { kind: 'range', default: layoutTuning.navBottomInset, min: 0, max: 120, step: 5, label: 'Nav bottom inset' },
})

/**
 * Flattens working values into the POST /__atelier/write chain payload —
 * every layoutTuning key, since the generator regenerates the file whole.
 */
export function chainPayload(values: AxisValues): Record<string, number> {
    const out: Record<string, number> = {}
    for (const key of Object.keys(layoutTuning)) {
        out[key] = values[key] as number
    }
    return out
}

/** AtelierStore axis key for the Chain axis. */
export const CHAIN_AXIS = 'chain'

/** Routes whose layout is a computed chain over layoutTuning — the Layout
 * tab shows the chain constants on these (data-layout routes get arrange
 * mode instead; everything else gets the explanation stub). */
export const CHAIN_ROUTE_PATHS = ['/blog', '/stuff/flash']

export function isChainPathname(pathname: string): boolean {
    const trimmed =
        pathname.length > 1 && pathname.endsWith('/')
            ? pathname.slice(0, -1)
            : pathname
    return CHAIN_ROUTE_PATHS.includes(trimmed)
}
