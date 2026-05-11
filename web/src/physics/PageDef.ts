export type Cardinal = 'down' | 'up' | 'left' | 'right'
export type Buoyancy = 'heavy' | 'balloon'
export type ParentRef = 'ceiling' | 'floor' | string
export type CardKind = 'lifelog' | 'blog' | 'portfolio' | 'note' | 'link' | 'headline'

export interface CardSpec {
    id: string
    kind: CardKind
    parent: ParentRef
}

export interface PageDef {
    gravity: Cardinal
    cards: CardSpec[]
}

export function buoyancyForKind(kind: CardKind): Buoyancy {
    return kind === 'note' ? 'balloon' : 'heavy'
}
