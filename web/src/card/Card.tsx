import { useEffect, useId, useMemo } from 'react'
import { useCardRegistry } from './CardRegistry'
import type { Buoyancy, ParentRef } from '../physics/PageSpec'

export interface CardProps {
    text: string
    width: number
    height: number
    anchor: { x: number; y: number }
    children?: React.ReactNode
    header?: React.ReactNode
    variant?: string
    className?: string
    style?: React.CSSProperties
    id?: string
    label?: string
    kind?: string
    parent?: ParentRef
    trail?: ParentRef
    buoyancy?: Buoyancy
    draggable?: boolean
}

export function Card(props: CardProps) {
    const generatedId = useId()
    const id = props.id ?? generatedId
    const registry = useCardRegistry()

    const entry = useMemo(
        () => ({
            id,
            parent: props.parent ?? null,
            trail: props.trail,
            kind: props.kind ?? 'card',
            buoyancy: props.buoyancy ?? 'heavy',
            anchor: props.anchor,
            content: {
                text: props.text,
                width: props.width,
                height: props.height,
                children: props.children,
                header: props.header,
                label: props.label,
                draggable: props.draggable,
                variant: props.variant,
                className: props.className,
                style: props.style,
            },
        }),
        [
            id,
            props.parent,
            props.trail,
            props.kind,
            props.buoyancy,
            props.anchor.x,
            props.anchor.y,
            props.text,
            props.width,
            props.height,
            props.children,
            props.header,
            props.label,
            props.draggable,
            props.variant,
            props.className,
            props.style,
        ],
    )

    useEffect(() => {
        registry.register(entry)
    }, [registry, entry])

    useEffect(() => {
        return () => {
            registry.requestUnregister(id)
        }
    }, [registry, id])

    return null
}
