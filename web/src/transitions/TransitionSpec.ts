export type TransitionId =
    | 'string-cut-drop'
    | 'pour-in-drop'
    | 'anchor-slide'
    | 'cross-fade'

export interface TransitionSpec {
    transitions?: {
        exit?: TransitionId
        enter?: TransitionId
    }
    siblingOrder?: 'left' | 'right'
}
