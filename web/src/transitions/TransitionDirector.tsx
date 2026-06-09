import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    type ReactNode,
} from 'react'
import { useLocation, useNavigationType, type Location } from 'react-router-dom'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import { physicsTuning } from '../physics/physicsTuning'
import {
    useCardRegistry,
    type CardActivator,
    type CardEntry,
} from '../card/CardRegistry'
import { classifyDirection, type NavigationType } from './classifyDirection'
import {
    dispatch,
    type EdgeTransitions,
    type PageDefResolver,
    type TransitionPlan,
} from './dispatch'
import { usePageDefRegistry } from './PageDefRegistry'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { stringCutDrop } from './primitives/stringCutDrop'
import { pourInDrop, type PourInDropEntry } from './primitives/pourInDrop'
import { anchorSlide } from './primitives/anchorSlide'
import { crossFade } from './primitives/crossFade'
import type { PrimitiveStep } from './primitives/types'
import type { PageDef } from '../routes/PageDef'
import type { TransitionId } from './TransitionSpec'
import type { Viewport } from '../physics/PhysicsWorld'

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
    const pageDefRegistry = usePageDefRegistry()
    const world = usePhysicsWorld()

    // Runtime registrations (via useRegisterPageDef) take precedence over the
    // static map. This is how dynamic routes (/blog/:slug, /stuff/flash/:slug)
    // participate in dispatch.
    const resolvePageDef: PageDefResolver = useCallback(
        (path: string) => pageDefRegistry.resolve(path) ?? pageDefs[path],
        [pageDefRegistry, pageDefs],
    )

    const prevLocationRef = useRef<Location | null>(null)
    const reducedRef = useRef(reduced)
    reducedRef.current = reduced

    const executeTransition = useCallback(
        async (_fromPath: string, _toPath: string, plan: TransitionPlan) => {
            // Source of truth is the registry: cards marked `exiting` belong
            // to the outgoing route; cards still `spawning` are the incoming
            // ones registered by the newly-mounted route's <Card>s
            // (Director Armed before they registered, so default-policy
            // auto-activate is suppressed and the primitive owns activation).
            // This lets routes that aren't listed in `pageDefs` (e.g. /blog,
            // dynamic slug pages) participate in the standard transition.
            const snapshot = registry.snapshot()
            const exitingEntries = snapshot.filter((e) => e.state === 'exiting')
            const enteringEntries = snapshot.filter(
                (e) => e.state === 'spawning',
            )
            const fromIds = exitingEntries.map((e) => e.id)
            const toIds = enteringEntries.map((e) => e.id)
            const pourEntries = enteringEntries.map((e, i) =>
                makePourEntry(e, i),
            )
            const viewport = getViewport()

            const releaseFromIds = () => {
                for (const id of fromIds) registry.release(id)
                registry.disarm()
            }

            if (reducedRef.current) {
                releaseFromIds()
                const layerEl = findPhysicsLayerElement()
                if (layerEl) {
                    await runStep(
                        crossFade(layerEl, registry, toIds, {
                            durationMs: physicsTuning.reducedMotionMs,
                        }),
                    )
                }
                return
            }

            if (plan.kind === 'coupled') {
                // Resolve the static-edge handle here so the primitive doesn't
                // need to know world identity (ceiling/floor). See BodyDriver.
                const sensorEdgeHandle =
                    plan.config.sensorEdges === 'ceiling'
                        ? world.ceilingHandle
                        : plan.config.sensorEdges === 'floor'
                          ? world.floorHandle
                          : undefined
                const step = anchorSlide(
                    world,
                    registry,
                    { fromIds, toIds },
                    {
                        axis: plan.config.axis,
                        sign: plan.config.sign,
                        durationMs: plan.config.durationMs,
                        viewport,
                        sensorEdgeHandle,
                    },
                )
                await runStep(step)
                releaseFromIds()
                return
            }

            // decoupled
            const exitStep = buildPrimitive(
                plan.exit,
                world,
                registry,
                viewport,
                fromIds,
                pourEntries,
            )
            const enterStep = buildPrimitive(
                plan.enter,
                world,
                registry,
                viewport,
                fromIds,
                pourEntries,
            )

            await Promise.all([runStep(exitStep), runStep(enterStep)])
            releaseFromIds()
        },
        [registry, world],
    )

    const dispatchTransition = useCallback(
        (fromPath: string, toPath: string, direction: ReturnType<typeof classifyDirection>) => {
            const plan = dispatch(fromPath, toPath, resolvePageDef, edges, direction)
            return executeTransition(fromPath, toPath, plan).catch((err) => {
                if (import.meta.env.DEV) throw err
                console.warn(
                    'TransitionDirector: transition failed; falling back to instant swap.',
                    err,
                )
                for (const entry of registry.snapshot()) {
                    if (entry.state === 'exiting') registry.release(entry.id)
                }
                registry.disarm()
            })
        },
        [resolvePageDef, edges, executeTransition, registry],
    )

    const isTransitionTrigger = useCallback(
        (
            prev: Location,
            next: Location,
        ): { trigger: boolean; from: string; to: string } => {
            const samePath = prev.pathname === next.pathname
            if (!samePath) {
                return {
                    trigger: true,
                    from: prev.pathname,
                    to: next.pathname,
                }
            }
            const hashChanged = prev.hash !== next.hash
            if (!hashChanged) {
                return { trigger: false, from: '', to: '' }
            }
            // Same-pathname hash change is only a transition if the destination
            // pageDef opts in via `sections`. Otherwise, treat as a non-event
            // (e.g. clicking a `#footer` link should not animate cards).
            const sections = resolvePageDef(next.pathname)?.sections
            if (!sections) return { trigger: false, from: '', to: '' }
            return {
                trigger: true,
                from: `${prev.pathname}${prev.hash}`,
                to: `${next.pathname}${next.hash}`,
            }
        },
        [resolvePageDef],
    )

    // Phase 1: BEFORE old route's cleanups, mark every currently-active card
    // as exiting so the registry preserves them across the unmount. Sourcing
    // from the registry (instead of pageDefs[prev]) covers routes that are
    // not declared in `pageDefs` — e.g. /blog or dynamic slug pages — whose
    // cards would otherwise pop out instantly when the route unmounts.
    useLayoutEffect(() => {
        const prev = prevLocationRef.current
        if (!prev) return
        const { trigger } = isTransitionTrigger(prev, location)
        if (!trigger) return
        registry.arm()
        for (const entry of registry.snapshot()) {
            if (entry.state !== 'exiting') registry.markExiting(entry.id)
        }
    }, [location, registry, isTransitionTrigger])

    // Phase 2: AFTER children's effects (new cards now registered in PhysicsWorld),
    // dispatch and execute the transition primitives.
    useEffect(() => {
        const prev = prevLocationRef.current
        if (!prev) {
            prevLocationRef.current = location
            return
        }
        const { trigger, from, to } = isTransitionTrigger(prev, location)
        if (!trigger) {
            prevLocationRef.current = location
            return
        }
        const direction = classifyDirection(navType)
        dispatchTransition(from, to, direction)
        prevLocationRef.current = location
    }, [location, navType, dispatchTransition, isTransitionTrigger])

    return <>{children}</>
}

function buildPrimitive(
    id: TransitionId,
    world: ReturnType<typeof usePhysicsWorld>,
    activator: CardActivator,
    viewport: Viewport,
    fromIds: readonly string[],
    toEntries: readonly PourInDropEntry[],
): PrimitiveStep {
    const toIds = toEntries.map((e) => e.id)
    switch (id) {
        case 'string-cut-drop':
            return stringCutDrop(world, fromIds, {
                viewport,
                floorHandle: world.floorHandle,
            })
        case 'pour-in-drop':
            return pourInDrop(world, activator, toEntries, { viewport })
        case 'anchor-slide':
            return anchorSlide(
                world,
                activator,
                { fromIds, toIds },
                {
                    axis: 'horizontal',
                    sign: 1,
                    durationMs: physicsTuning.anchorSlideDurationMs,
                    viewport,
                },
            )
        case 'cross-fade': {
            const el = findPhysicsLayerElement()
            if (!el) return () => true
            return crossFade(el, activator, toIds, {
                durationMs: physicsTuning.reducedMotionMs,
            })
        }
    }
}

function makePourEntry(
    entry: CardEntry,
    index: number,
): PourInDropEntry {
    // Base delay gives the outgoing cards visible time to clear the viewport
    // before the new ones arrive. Read-at-use per transition event.
    return {
        id: entry.id,
        layoutAnchor: entry.anchor,
        height: entry.content.height,
        staggerMs:
            physicsTuning.pourInBaseDelayMs +
            index * physicsTuning.pourInStaggerMs,
    }
}
