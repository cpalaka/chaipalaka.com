/**
 * AtelierGate — the only Atelier element production code mounts.
 *
 * In dev: a corner toggle that lazy-loads the inspector on first open and
 * keeps it mounted (display-toggled) afterwards so tab/scroll state survives
 * collapse. In prod: import.meta.env.DEV is statically false, the component
 * renders null, and the dynamic import is dead code — the panel chunk never
 * ships (AC: manual chunk inspection; automated guard is task-010).
 */

import { lazy, Suspense, useState } from 'react'
import type { CSSProperties } from 'react'

const AtelierPanel = import.meta.env.DEV
    ? lazy(() => import('./AtelierPanel'))
    : null

const toggleStyle: CSSProperties = {
    position: 'fixed',
    bottom: 12,
    zIndex: 10000,
    padding: '4px 10px',
    background: '#101418',
    color: '#8ab4d0',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: '0.06em',
    cursor: 'pointer',
}

export function AtelierGate() {
    const [open, setOpen] = useState(false)
    const [everOpened, setEverOpened] = useState(false)

    if (!AtelierPanel) return null

    return (
        <>
            <button
                type="button"
                aria-label="Toggle Atelier"
                style={{ ...toggleStyle, right: open ? 332 : 12 }}
                onClick={() => {
                    setOpen(!open)
                    setEverOpened(true)
                }}
            >
                atelier
            </button>
            {everOpened && (
                <Suspense fallback={null}>
                    <AtelierPanel open={open} />
                </Suspense>
            )}
        </>
    )
}
