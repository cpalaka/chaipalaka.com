import type { Vec2, Viewport } from './PhysicsWorld'

export type Cardinal = 'down' | 'up' | 'left' | 'right'
export type Buoyancy = 'heavy' | 'balloon'
// 'ceiling'/'floor' = the viewport edges; 'box-top'/'box-bottom' = the v2
// content-box edges (the edge-anchored regime); any other string = a card id.
export type ParentRef =
    | 'ceiling'
    | 'floor'
    | 'box-top'
    | 'box-bottom'
    | string
    | null
export type CardKind =
    | 'lifelog'
    | 'blog'
    | 'portfolio'
    | 'note'
    | 'link'
    | 'headline'
    | 'nav'

export type ChainNavTarget = 'prev' | 'next'

export interface CardSpec {
    id: string
    kind: CardKind
    parent: ParentRef
    anchor: (viewport: Viewport) => Vec2
    sectionBreak?: 'before' | 'after'
    // Secondary tether — e.g. a paginated section's terminal nav card uses
    // `trail: 'floor'` so a string visibly continues from the card to the
    // floor, implying the chain extends below the screen.
    trail?: ParentRef
    // Optional extra spawn offset applied on top of the gravity-aligned
    // default in computeSpawnOffset. Use to spawn a card off its layout
    // anchor (e.g. for a settle-in animation under physics). The card's
    // rest position is still the anchor; spawnOffset only affects where
    // it materialises in the first frame.
    spawnOffset?: Vec2
}

export interface AuthorSectionDef {
    cardIds: readonly string[]
}

export type SectionsConfig =
    | { mode: 'author'; sections: readonly AuthorSectionDef[] }
    | { mode: 'auto-chain'; chainRoot?: string; maxPerSection?: number }

// v2 per-route resting state (spec §7). 'quiet' = the box + inline links only;
// 'populated' = ambient cards seeded on arrival (the "ambient teacher"). Absent
// ⇒ 'quiet', so every pre-v2 PageSpec stays valid. The populated behaviour is
// driven by `useAmbientPins` reading this field; see pin/ambientPins.ts.
export type Resting = 'quiet' | 'populated'

export interface PageSpec {
    // Physics model (spec §3.2 / ADR-0010). Absent ⇒ `'drift'` (resolved in
    // usePageDef). `mode:'gravity'` opts a route into the dormant gravity mode.
    mode?: 'drift' | 'gravity'
    // The gravity direction — only meaningful under `mode:'gravity'`. Optional
    // now that drift is the default; `mode:'gravity'` + absent ⇒ 'down'.
    gravity?: Cardinal
    // Per-route drift intensity (default 1); scales the Brownian wander. Reading
    // routes author it near 0, canvas routes livelier. Authored route-side, never
    // in an Atelier-regenerated `.layout.ts` (D7).
    driftScale?: number
    resting?: Resting
    cards: CardSpec[]
    sections?: SectionsConfig
}

export function buoyancyForKind(kind: CardKind): Buoyancy {
    return kind === 'note' ? 'balloon' : 'heavy'
}
