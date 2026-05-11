import { useState, useEffect, type ReactNode } from 'react'
import { PhysicsCard } from './PhysicsCard'
import { buoyancyForKind } from './PageDef'
import { usePageDef } from './usePageDef'
import type { PageDef } from './PageDef'
import type { Viewport } from './PhysicsWorld'

export interface CardContent {
    text: string
    width: number
    height: number
    children?: ReactNode
    minimizable?: boolean
    label?: string
}

function getViewport(): Viewport {
    return typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1024, height: 768 }
}

export function PhysicsPage({
    pageDef,
    cardContent,
}: {
    pageDef: PageDef
    cardContent: Record<string, CardContent>
}) {
    usePageDef(pageDef)

    const [viewport, setViewport] = useState<Viewport>(getViewport)

    useEffect(() => {
        function onResize() {
            setViewport(getViewport())
        }
        onResize()
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return (
        <>
            {pageDef.cards.map((spec) => {
                const c = cardContent[spec.id]
                const { x, y } = spec.anchor(viewport)
                return (
                    <PhysicsCard
                        key={spec.id}
                        id={spec.id}
                        text={c?.text ?? ''}
                        width={c?.width ?? 240}
                        height={c?.height ?? 160}
                        anchor={{ x, y }}
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
