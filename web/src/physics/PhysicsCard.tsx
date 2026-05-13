import { useEffect, useId, useMemo } from 'react'
import { useCardRegistry } from '../transitions/CardRegistry'
import type {
    PhysicsHandle,
    PhysicsWorld,
    TetherHandle,
    Vec2,
} from './PhysicsWorld'
import type { Buoyancy, ParentRef } from './PageDef'

type ParentKind = 'ceiling' | 'floor' | 'card'

export function wireTetherFor(
    world: PhysicsWorld,
    parentHandle: PhysicsHandle,
    parentKind: ParentKind,
    childHandle: PhysicsHandle,
    childAnchor: Vec2,
): TetherHandle {
    const parentBodyPos = world.getPosition(parentHandle)
    if (parentKind === 'card') {
        const length = Math.hypot(
            childAnchor.x - parentBodyPos.x,
            childAnchor.y - parentBodyPos.y,
        )
        return world.tether(parentHandle, childHandle, length)
    }
    const parentAnchor = world.getAnchor(parentHandle)
    const anchorA = {
        x: childAnchor.x - parentBodyPos.x,
        y: parentAnchor.y - parentBodyPos.y,
    }
    const length = Math.abs(childAnchor.y - parentAnchor.y)
    return world.tether(parentHandle, childHandle, length, anchorA)
}

export interface PhysicsCardProps {
    text: string
    width: number
    height: number
    anchor: { x: number; y: number }
    children?: React.ReactNode
    header?: React.ReactNode
    variant?: string
    className?: string
    style?: React.CSSProperties
    minimizable?: boolean
    id?: string
    label?: string
    kind?: string
    parent?: ParentRef
    trail?: ParentRef
    buoyancy?: Buoyancy
    draggable?: boolean
}

export function PhysicsCard(props: PhysicsCardProps) {
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
                minimizable: props.minimizable,
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
            props.minimizable,
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
