import type { ComponentType } from 'react'

export interface BackgroundScene {
    id: string
    Component: ComponentType
    accentColor: string
    fallbackColors: readonly [string, string]
    fallbackPng: string
}

export interface BackgroundRegistry {
    get(id: string): BackgroundScene | undefined
    has(id: string): boolean
    list(): readonly BackgroundScene[]
}
