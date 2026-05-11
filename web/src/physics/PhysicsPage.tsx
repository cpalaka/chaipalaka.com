import { useState, useEffect, type ReactNode } from 'react'
import { PhysicsCard } from './PhysicsCard'
import { cardLayout, type CardAnchor } from './CardLayout'
import { buoyancyForKind } from './PageDef'
import { usePageDef } from './usePageDef'
import type { PageDef } from './PageDef'

export interface CardContent {
    text: string
    width: number
    height: number
    children?: ReactNode
    minimizable?: boolean
    label?: string
}

function getViewport() {
    return typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1024, height: 768 }
}

function noopMeasure() {
    return { width: 0, height: 0 }
}

export function PhysicsPage({
    pageDef,
    cardContent,
}: {
    pageDef: PageDef
    cardContent: Record<string, CardContent>
}) {
    usePageDef(pageDef)

    const [anchors, setAnchors] = useState<CardAnchor[]>(() => {
        const inputs = pageDef.cards.map((spec) => {
            const c = cardContent[spec.id]
            return {
                id: spec.id,
                text: c?.text ?? '',
                fontKey: 'body',
                width: c?.width,
                height: c?.height,
            }
        })
        return cardLayout(inputs, getViewport(), noopMeasure)
    })

    useEffect(() => {
        function recompute() {
            const inputs = pageDef.cards.map((spec) => {
                const c = cardContent[spec.id]
                return {
                    id: spec.id,
                    text: c?.text ?? '',
                    fontKey: 'body',
                    width: c?.width,
                    height: c?.height,
                }
            })
            setAnchors(cardLayout(inputs, getViewport(), noopMeasure))
        }
        recompute()
        window.addEventListener('resize', recompute, { passive: true })
        return () => window.removeEventListener('resize', recompute)
    }, [pageDef, cardContent])

    // Build anchor lookup once per render
    const anchorById = new Map(anchors.map((a) => [a.id, a]))

    return (
        <>
            {pageDef.cards.map((spec) => {
                const anchor = anchorById.get(spec.id)
                if (!anchor) return null
                const c = cardContent[spec.id]
                return (
                    <PhysicsCard
                        key={spec.id}
                        id={spec.id}
                        text={c?.text ?? ''}
                        width={anchor.width}
                        height={anchor.height}
                        anchor={{ x: anchor.x, y: anchor.y }}
                        parent={spec.parent}
                        buoyancy={buoyancyForKind(spec.kind)}
                        minimizable={c?.minimizable ?? false}
                        label={c?.label}
                    >
                        {c?.children}
                    </PhysicsCard>
                )
            })}
        </>
    )
}
