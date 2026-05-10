export interface TocEntry {
    depth: number
    text: string
    slug: string
}

export interface PostFrontmatter {
    title: string
    description: string
    date: string
    tags: string[]
    draft: boolean
    og_image?: string
}

export interface Post {
    slug: string
    frontmatter: PostFrontmatter
    toc: TocEntry[]
    Component: React.ComponentType<{
        components?: Record<string, React.ComponentType<any>>
    }>
}
