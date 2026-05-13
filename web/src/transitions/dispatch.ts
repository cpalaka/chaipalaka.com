import type { PageDef, TransitionId } from '../physics/PageDef'
import type { Direction } from './classifyDirection'

export interface AnchorSlideConfig {
    primitive: 'anchor-slide'
    axis: 'horizontal' | 'vertical'
    sign: 1 | -1
    durationMs: number
    sensorEdges?: 'ceiling' | 'floor' | 'none'
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

function splitPathAndHash(s: string): { pathname: string; hash: string } {
    const i = s.indexOf('#')
    if (i === -1) return { pathname: s, hash: '' }
    return { pathname: s.slice(0, i), hash: s.slice(i) }
}

/**
 * Parse a hash like `#s2` → 2. Empty / unrecognised → 1 (canonical section).
 */
export function parseSectionHash(hash: string): number {
    const m = /^#s(\d+)$/.exec(hash)
    if (!m) return 1
    const n = Number.parseInt(m[1]!, 10)
    return Number.isFinite(n) && n >= 1 ? n : 1
}

export function dispatch(
    from: string,
    to: string,
    resolvePageDef: PageDefResolver,
    edges: EdgeTransitions,
    direction: Direction,
): TransitionPlan {
    const fromParts = splitPathAndHash(from)
    const toParts = splitPathAndHash(to)

    // Within-page section transition: same pathname, sections-bearing pageDef,
    // hashes differ. Produces a vertical anchor-slide whose sign is determined
    // by the section delta, not history direction.
    if (fromParts.pathname === toParts.pathname && fromParts.hash !== toParts.hash) {
        const def = resolvePageDef(toParts.pathname)
        if (def?.sections) {
            const fromIdx = parseSectionHash(fromParts.hash)
            const toIdx = parseSectionHash(toParts.hash)
            const sign: 1 | -1 = toIdx > fromIdx ? 1 : -1
            // T4: forward (sign=+1) drags chain up through the ceiling;
            // back (sign=-1) drags down through the floor.
            const sensorEdges: 'ceiling' | 'floor' = sign === 1 ? 'ceiling' : 'floor'
            return {
                kind: 'coupled',
                config: {
                    primitive: 'anchor-slide',
                    axis: 'vertical',
                    sign,
                    durationMs: DEFAULT_ANCHOR_SLIDE_DURATION_MS,
                    sensorEdges,
                },
            }
        }
    }

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

    const fromDef = resolvePageDef(fromParts.pathname)
    const toDef = resolvePageDef(toParts.pathname)
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
