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

export interface PageSpec {
    gravity: Cardinal
    cards: CardSpec[]
    sections?: SectionsConfig
}

export function buoyancyForKind(kind: CardKind): Buoyancy {
    return kind === 'note' ? 'balloon' : 'heavy'
}
