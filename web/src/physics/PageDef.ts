import type { Vec2, Viewport } from './PhysicsWorld'

export type Cardinal = 'down' | 'up' | 'left' | 'right'
export type Buoyancy = 'heavy' | 'balloon'
export type ParentRef = 'ceiling' | 'floor' | string | null
export type CardKind = 'lifelog' | 'blog' | 'portfolio' | 'note' | 'link' | 'headline'

export type TransitionId =
    | 'string-cut-drop'
    | 'pour-in-drop'
    | 'anchor-slide'
    | 'cross-fade'

export interface CardSpec {
    id: string
    kind: CardKind
    parent: ParentRef
    anchor: (viewport: Viewport) => Vec2
}

export interface PageDef {
    gravity: Cardinal
    cards: CardSpec[]
    transitions?: {
        exit?: TransitionId
        enter?: TransitionId
    }
    siblingOrder?: 'left' | 'right'
}

export function buoyancyForKind(kind: CardKind): Buoyancy {
    return kind === 'note' ? 'balloon' : 'heavy'
}
