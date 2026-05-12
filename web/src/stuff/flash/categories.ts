export interface CategoryMeta {
    label: string
    description?: string
}

export const categories: Record<string, CategoryMeta> = {
    'shorts': {
        label: 'Shorts',
        description: 'Finished short animations.',
    },
    'tests': {
        label: 'Tests',
        description: 'Animation tests and exercises.',
    },
    'unfinished': {
        label: 'Unfinished',
        description: 'Pieces I never finished.',
    },
}

export function getCategoryMeta(slug: string): CategoryMeta {
    return categories[slug] ?? { label: slug }
}
