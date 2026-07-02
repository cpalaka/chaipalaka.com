import type { Cardinal, CardKind, PageSpec, ParentRef } from '../physics/PageSpec'
import type { Vec2, Viewport } from '../physics/PhysicsWorld'

/**
 * A card anchor as authored in a route's `.layout.ts` data file:
 * either viewport fractions `{ fx, fy }` (the regenerable, drag-editable
 * form) or a closure for computed layouts.
 */
export type LayoutAnchor = { fx: number; fy: number } | ((viewport: Viewport) => Vec2)

export interface LayoutCardSpec {
    id: string
    kind: CardKind
    parent: ParentRef
    anchor: LayoutAnchor
}

/**
 * The data half of a scatter route's PageSpec, authored in a sibling
 * `web/src/routes/<route>.layout.ts` file. Layout files written entirely
 * with fraction anchors are pure data literals — the Atelier's write-back
 * regenerates them whole (no AST surgery; see the atelier design spec).
 */
export interface RouteLayout {
    // Optional now that drift is the default (spec §3.2). Present only for a
    // route in the dormant gravity mode; drift routes omit it. `mode`/`driftScale`
    // are never authored here (whole-file Atelier regen would drop them, D7) —
    // they live route-side and are re-injected by applyLayoutOverride.
    gravity?: Cardinal
    cards: readonly LayoutCardSpec[]
}

export function resolveAnchor(anchor: LayoutAnchor): (viewport: Viewport) => Vec2 {
    if (typeof anchor === 'function') return anchor
    return (vp) => ({ x: vp.width * anchor.fx, y: vp.height * anchor.fy })
}

export function pageSpecFromLayout(layout: RouteLayout): PageSpec {
    return {
        // Emit gravity only when the layout declares it (drift routes omit it).
        ...(layout.gravity !== undefined ? { gravity: layout.gravity } : {}),
        cards: layout.cards.map((c) => ({ ...c, anchor: resolveAnchor(c.anchor) })),
    }
}
