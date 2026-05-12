import {
    createContext,
    use,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    type ReactNode,
} from 'react'
import { useLocation, useNavigationType, type Location } from 'react-router-dom'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import { useCardRegistry } from './CardRegistry'
import { classifyDirection, type NavigationType } from './classifyDirection'
import { dispatch, type EdgeTransitions, type TransitionPlan } from './dispatch'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { stringCutDrop } from './primitives/stringCutDrop'
import { pourInDrop, type PourInDropEntry } from './primitives/pourInDrop'
import { anchorSlide } from './primitives/anchorSlide'
import { crossFade } from './primitives/crossFade'
import type { PrimitiveStep } from './primitives/types'
import type { PageDef, TransitionId } from '../physics/PageDef'
import type { Viewport } from '../physics/PhysicsWorld'

const REDUCED_MOTION_MS = 150

export interface RunTransitionArgs {
    from: string
    to: string
}

export interface TransitionContextValue {
    runTransition: (args: RunTransitionArgs) => void
}

const TransitionContext = createContext<TransitionContextValue | null>(null)

export function useTransitionContext(): TransitionContextValue {
    const ctx = use(TransitionContext)
    if (!ctx)
        throw new Error(
            'useTransitionContext: must be used inside <TransitionDirector>',
        )
    return ctx
}

export interface TransitionDirectorProps {
    pageDefs: Record<string, PageDef>
    edges?: EdgeTransitions
    children?: ReactNode
}

function getViewport(): Viewport {
    return typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1024, height: 768 }
}

function runStep(step: PrimitiveStep): Promise<void> {
    return new Promise((resolve) => {
        let last = performance.now()
        const tick = () => {
            const now = performance.now()
            const dt = now - last
            last = now
            if (step(dt)) resolve()
            else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
    })
}

function findPhysicsLayerElement(): HTMLElement | null {
    if (typeof document === 'undefined') return null
    return document.querySelector('[data-physics-layer]') as HTMLElement | null
}

export function TransitionDirector({
    pageDefs,
    edges = {},
    children,
}: TransitionDirectorProps) {
    const location = useLocation()
    const navType = useNavigationType() as NavigationType
    const reduced = usePrefersReducedMotion()
    const registry = useCardRegistry()
    const world = usePhysicsWorld()

    const prevLocationRef = useRef<Location | null>(null)
    const reducedRef = useRef(reduced)
    reducedRef.current = reduced

    const executeTransition = useCallback(
        async (fromPath: string, toPath: string, plan: TransitionPlan) => {
            const fromCards = pageDefs[fromPath]?.cards ?? []
            const toCards = pageDefs[toPath]?.cards ?? []
            const fromIds = fromCards.map((c) => c.id)
            const toIds = toCards.map((c) => c.id)
            const viewport = getViewport()

            const releaseFromIds = () => {
                for (const id of fromIds) registry.release(id)
            }

            if (reducedRef.current) {
                releaseFromIds()
                const layerEl = findPhysicsLayerElement()
                if (layerEl) {
                    await runStep(crossFade(layerEl, { durationMs: REDUCED_MOTION_MS }))
                }
                return
            }

            if (plan.kind === 'coupled') {
                const step = anchorSlide(
                    world,
                    { fromIds, toIds },
                    { ...plan.config, viewport },
                )
                await runStep(step)
                releaseFromIds()
                return
            }

            // decoupled
            const exitStep = buildPrimitive(
                plan.exit,
                world,
                viewport,
                fromIds,
                toCards
                    .map((c, i) => makePourEntry(c, i, registry))
                    .filter((x): x is PourInDropEntry => x !== null),
            )
            const enterStep = buildPrimitive(
                plan.enter,
                world,
                viewport,
                fromIds,
                toCards
                    .map((c, i) => makePourEntry(c, i, registry))
                    .filter((x): x is PourInDropEntry => x !== null),
            )

            await Promise.all([runStep(exitStep), runStep(enterStep)])
            releaseFromIds()
        },
        [pageDefs, registry, world],
    )

    const dispatchTransition = useCallback(
        (fromPath: string, toPath: string, direction: ReturnType<typeof classifyDirection>) => {
            const plan = dispatch(fromPath, toPath, pageDefs, edges, direction)
            return executeTransition(fromPath, toPath, plan).catch((err) => {
                if (import.meta.env.DEV) throw err
                console.warn(
                    'TransitionDirector: transition failed; falling back to instant swap.',
                    err,
                )
                for (const entry of registry.snapshot()) {
                    if (entry.state === 'exiting') registry.release(entry.id)
                }
            })
        },
        [pageDefs, edges, executeTransition, registry],
    )

    // Phase 1: BEFORE old route's cleanups, mark its cards as exiting so the
    // registry preserves them across the unmount.
    useLayoutEffect(() => {
        const prev = prevLocationRef.current
        if (!prev || prev.pathname === location.pathname) return
        const oldPageDef = pageDefs[prev.pathname]
        if (!oldPageDef) return
        for (const card of oldPageDef.cards) {
            registry.markExiting(card.id)
        }
    }, [location, registry, pageDefs])

    // Phase 2: AFTER children's effects (new cards now registered in PhysicsWorld),
    // dispatch and execute the transition primitives.
    useEffect(() => {
        const prev = prevLocationRef.current
        if (!prev) {
            prevLocationRef.current = location
            return
        }
        if (prev.pathname === location.pathname) {
            prevLocationRef.current = location
            return
        }
        const direction = classifyDirection(navType)
        dispatchTransition(prev.pathname, location.pathname, direction)
        prevLocationRef.current = location
    }, [location, navType, dispatchTransition])

    const runTransition = useCallback(
        ({ from, to }: RunTransitionArgs) => {
            const direction = classifyDirection(navType)
            dispatchTransition(from, to, direction)
        },
        [navType, dispatchTransition],
    )

    return (
        <TransitionContext.Provider value={{ runTransition }}>
            {children}
        </TransitionContext.Provider>
    )
}

function buildPrimitive(
    id: TransitionId,
    world: ReturnType<typeof usePhysicsWorld>,
    viewport: Viewport,
    fromIds: readonly string[],
    toEntries: readonly PourInDropEntry[],
): PrimitiveStep {
    switch (id) {
        case 'string-cut-drop':
            return stringCutDrop(world, fromIds, { viewport })
        case 'pour-in-drop':
            return pourInDrop(world, toEntries, { viewport })
        case 'anchor-slide':
            return anchorSlide(
                world,
                {
                    fromIds,
                    toIds: toEntries.map((e) => e.id),
                },
                {
                    axis: 'horizontal',
                    sign: 1,
                    durationMs: 700,
                    viewport,
                },
            )
        case 'cross-fade': {
            const el = findPhysicsLayerElement()
            if (!el) return () => true
            return crossFade(el, { durationMs: REDUCED_MOTION_MS })
        }
    }
}

function makePourEntry(
    card: { id: string },
    index: number,
    registry: ReturnType<typeof useCardRegistry>,
): PourInDropEntry | null {
    const entry = registry.snapshot().find((e) => e.id === card.id)
    if (!entry) return null
    return {
        id: card.id,
        layoutAnchor: entry.anchor,
        height: entry.content.height,
        staggerMs: index * 80,
    }
}
