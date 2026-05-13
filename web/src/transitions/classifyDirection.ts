export type Direction = 'forward' | 'back' | 'sibling'
export type NavigationType = 'PUSH' | 'POP' | 'REPLACE'

export function classifyDirection(navType: NavigationType): Direction {
    if (navType === 'POP') return 'back'
    if (navType === 'REPLACE') return 'sibling'
    return 'forward'
}
