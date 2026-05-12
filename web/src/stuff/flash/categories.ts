export interface CategoryMeta {
    label: string
    description?: string
}

export const categories: Record<string, CategoryMeta> = {
    'stick-figures': {
        label: 'Stick Figures',
        description: 'Stick-figure shorts — 2004–2008.',
    },
    'shorts': {
        label: 'Flash Shorts',
        description: 'Loose micro-animations and gag pieces.',
    },
}

export function getCategoryMeta(slug: string): CategoryMeta {
    return categories[slug] ?? { label: slug }
}
