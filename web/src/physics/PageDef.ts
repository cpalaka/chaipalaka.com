export type Cardinal = 'down' | 'up' | 'left' | 'right'
export type Buoyancy = 'heavy' | 'balloon'
export type ParentRef = 'ceiling' | 'floor' | string

export interface CardSpec {
    id: string
    width: number
    height: number
    parent?: ParentRef
    buoyancy?: Buoyancy
    minimizable?: boolean
}

export interface PageDef {
    gravity: Cardinal
    cards: CardSpec[]
}
