import type { Vec2, Viewport } from './PhysicsWorld'

export type Cardinal = 'down' | 'up' | 'left' | 'right'
export type Buoyancy = 'heavy' | 'balloon'
export type ParentRef = 'ceiling' | 'floor' | string | null
export type CardKind =
    | 'lifelog'
    | 'blog'
    | 'portfolio'
    | 'note'
    | 'link'
    | 'headline'
    | 'nav'

export type TransitionId =
    | 'string-cut-drop'
    | 'pour-in-drop'
    | 'anchor-slide'
    | 'cross-fade'

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
}

export interface AuthorSectionDef {
    cardIds: readonly string[]
}

export type SectionsConfig =
    | { mode: 'author'; sections: readonly AuthorSectionDef[] }
    | { mode: 'auto-chain'; chainRoot?: string; maxPerSection?: number }

export interface PageDef {
    gravity: Cardinal
    cards: CardSpec[]
    transitions?: {
        exit?: TransitionId
        enter?: TransitionId
    }
    siblingOrder?: 'left' | 'right'
    sections?: SectionsConfig
    sectionsPushHistory?: boolean
}

export function buoyancyForKind(kind: CardKind): Buoyancy {
    return kind === 'note' ? 'balloon' : 'heavy'
}
