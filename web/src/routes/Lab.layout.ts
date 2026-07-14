import type { RouteLayout } from './routeLayout'

// Pure data literal — the Atelier regenerates this file whole on write-back.
// /lab is the box-less drift toy for the task-038 SDF metaball auras: 12 detached
// specimen cards (parent: null → no tether) on a loose grid, no content box.
// `mode`/`driftScale` are authored route-side in Lab.tsx (D7), never here.
// Grid designed for a ~1440×900 viewport (4 cols × 3 rows), 240×160 cards with
// 60px gaps — column/row fractions hold that spacing on any viewport.
export const labLayout = {
    cards: [
        { id: 'lab-01', kind: 'link', parent: null, anchor: { fx: 0.1875, fy: 0.256 } },
        { id: 'lab-02', kind: 'link', parent: null, anchor: { fx: 0.396, fy: 0.256 } },
        { id: 'lab-03', kind: 'link', parent: null, anchor: { fx: 0.604, fy: 0.256 } },
        { id: 'lab-04', kind: 'link', parent: null, anchor: { fx: 0.8125, fy: 0.256 } },
        { id: 'lab-05', kind: 'link', parent: null, anchor: { fx: 0.1875, fy: 0.5 } },
        { id: 'lab-06', kind: 'link', parent: null, anchor: { fx: 0.396, fy: 0.5 } },
        { id: 'lab-07', kind: 'link', parent: null, anchor: { fx: 0.604, fy: 0.5 } },
        { id: 'lab-08', kind: 'link', parent: null, anchor: { fx: 0.8125, fy: 0.5 } },
        { id: 'lab-09', kind: 'link', parent: null, anchor: { fx: 0.1875, fy: 0.744 } },
        { id: 'lab-10', kind: 'link', parent: null, anchor: { fx: 0.396, fy: 0.744 } },
        { id: 'lab-11', kind: 'link', parent: null, anchor: { fx: 0.604, fy: 0.744 } },
        { id: 'lab-12', kind: 'link', parent: null, anchor: { fx: 0.8125, fy: 0.744 } },
    ],
} satisfies RouteLayout
