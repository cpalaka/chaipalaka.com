import type { RouteLayout } from './routeLayout'

// Pure data literal — the Atelier regenerates this file whole on write-back.
export const lifelogLayout = {
    cards: [
        {
            id: 'lifelog-books',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: { fx: 0.5, fy: 0.25 },
        },
        {
            id: 'lifelog-now-playing',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: { fx: 0.84, fy: 0.1 },
        },
        {
            id: 'lifelog-films',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: { fx: 0.5, fy: 0.75 },
        },
        {
            id: 'lifelog-activity',
            kind: 'lifelog',
            parent: 'ceiling',
            anchor: { fx: 0.16, fy: 0.5 },
        },
    ],
} satisfies RouteLayout
