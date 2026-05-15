import { useState, useEffect, type ReactNode } from 'react'
import { Card } from './Card'
import { buoyancyForKind } from '../physics/PageSpec'
import { usePageDef } from '../physics/usePageDef'
import type { PageSpec } from '../physics/PageSpec'
import type { Viewport } from '../physics/PhysicsWorld'

export interface CardContent {
    text: string
    width: number
    height: number
    children?: ReactNode
    header?: ReactNode
    label?: string
    draggable?: boolean
    variant?: string
    className?: string
    style?: React.CSSProperties
}

function getViewport(): Viewport {
    return typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 1024, height: 768 }
}

export function Page({
    pageDef,
    cardContent,
}: {
    pageDef: PageSpec
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
                    <Card
                        key={spec.id}
                        id={spec.id}
                        text={c?.text ?? ''}
                        width={c?.width ?? 240}
                        height={c?.height ?? 160}
                        anchor={{ x, y }}
                        parent={spec.parent}
                        trail={spec.trail}
                        buoyancy={buoyancyForKind(spec.kind)}
                        label={c?.label}
                        draggable={c?.draggable ?? true}
                        variant={c?.variant}
                        className={c?.className}
                        style={c?.style}
                    >
                        {c?.children}
                    </Card>
                )
            })}
        </>
    )
}
