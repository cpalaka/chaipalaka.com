/// <reference types="vite/client" />

declare module '*.mdx' {
    import type { ComponentType } from 'react'
    import type { PostFrontmatter, TocEntry } from './blog/types'

    const Component: ComponentType<{
        components?: Record<string, ComponentType<any>>
    }>
    export default Component
    export const frontmatter: PostFrontmatter
    export const toc: TocEntry[]
}
