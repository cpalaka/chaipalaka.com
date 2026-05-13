import type { PageDef, TransitionId } from '../physics/PageDef'
import type { Direction } from './classifyDirection'

export interface AnchorSlideConfig {
    primitive: 'anchor-slide'
    axis: 'horizontal' | 'vertical'
    sign: 1 | -1
    durationMs: number
}

export type CoupledConfig = AnchorSlideConfig

export type TransitionPlan =
    | { kind: 'coupled'; config: CoupledConfig }
    | {
          kind: 'decoupled'
          exit: TransitionId
          enter: TransitionId
          overlapMs: number
      }

export interface EdgeConfig {
    primitive: 'anchor-slide'
    axis: 'horizontal' | 'vertical'
    sign?: 1 | -1
    durationMs?: number
}

export type EdgeTransitions = Record<string, EdgeConfig>

export type PageDefResolver = (path: string) => PageDef | undefined

const DEFAULT_DECOUPLED_OVERLAP_MS = 200
const DEFAULT_ANCHOR_SLIDE_DURATION_MS = 700

function signFromDirection(direction: Direction): 1 | -1 {
    return direction === 'back' ? -1 : 1
}

export function dispatch(
    from: string,
    to: string,
    resolvePageDef: PageDefResolver,
    edges: EdgeTransitions,
    direction: Direction,
): TransitionPlan {
    const edgeKey = `${from}→${to}`
    const edge = edges[edgeKey]
    if (edge) {
        return {
            kind: 'coupled',
            config: {
                primitive: 'anchor-slide',
                axis: edge.axis,
                sign: edge.sign ?? signFromDirection(direction),
                durationMs: edge.durationMs ?? DEFAULT_ANCHOR_SLIDE_DURATION_MS,
            },
        }
    }

    const fromDef = resolvePageDef(from)
    const toDef = resolvePageDef(to)
    const fromExit = fromDef?.transitions?.exit
    const toEnter = toDef?.transitions?.enter
    if (fromExit || toEnter) {
        return {
            kind: 'decoupled',
            exit: fromExit ?? 'string-cut-drop',
            enter: toEnter ?? 'pour-in-drop',
            overlapMs: DEFAULT_DECOUPLED_OVERLAP_MS,
        }
    }

    if (direction === 'sibling') {
        const siblingOrder = toDef?.siblingOrder
        const sign: 1 | -1 = siblingOrder === 'left' ? -1 : 1
        return {
            kind: 'coupled',
            config: {
                primitive: 'anchor-slide',
                axis: 'horizontal',
                sign,
                durationMs: DEFAULT_ANCHOR_SLIDE_DURATION_MS,
            },
        }
    }

    return {
        kind: 'decoupled',
        exit: 'string-cut-drop',
        enter: 'pour-in-drop',
        overlapMs: DEFAULT_DECOUPLED_OVERLAP_MS,
    }
}
