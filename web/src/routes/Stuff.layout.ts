import type { RouteLayout } from './routeLayout'

// Pure data literal — the Atelier regenerates this file whole on write-back.
export const stuffLayout = {
    gravity: 'down',
    cards: [
        { id: 'stuff-flash', kind: 'portfolio', parent: 'ceiling', anchor: { fx: 0.25, fy: 0.25 } },
        { id: 'stuff-digital-art', kind: 'portfolio', parent: 'ceiling', anchor: { fx: 0.5, fy: 0.25 } },
        { id: 'stuff-software', kind: 'portfolio', parent: 'ceiling', anchor: { fx: 0.75, fy: 0.25 } },
        { id: 'stuff-site', kind: 'portfolio', parent: 'ceiling', anchor: { fx: 0.5, fy: 0.525 } },
    ],
} satisfies RouteLayout
