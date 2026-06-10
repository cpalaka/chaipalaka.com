/**
 * Physics axis body — curated sliders over physicsTuning (live via the
 * physics binding, see physicsBinding.ts) plus the re-drop replay button.
 * Transition timings carry no replay button: navigating is the replay.
 */

import type { CSSProperties } from 'react'
import { defaultsOf } from '../canvas/scenes/paramSchema'
import type { AtelierState } from './atelierStore'
import { TuningFields } from './widgets'
import { getAtelierStore } from './useAtelier'
import { PHYSICS_AXIS, PHYSICS_SCHEMA } from './schemas/physics'
import { bumpRedrop } from '../layouts/redropKey'

const captionStyle: CSSProperties = {
    color: '#5f7a8a',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: 0,
}

const redropStyle: CSSProperties = {
    padding: '4px 10px',
    background: 'rgba(95,182,196,0.18)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 3,
    color: '#5fb6c4',
    fontFamily: 'monospace',
    fontSize: 11,
    cursor: 'pointer',
}

export function PhysicsAxis({ state }: { state: AtelierState }) {
    const store = getAtelierStore()
    return (
        <>
            <button type="button" style={redropStyle} onClick={bumpRedrop}>
                Re-drop
            </button>
            <p style={captionStyle}>transition timings replay on navigation</p>
            <TuningFields
                schema={PHYSICS_SCHEMA}
                values={state.axes[PHYSICS_AXIS] ?? defaultsOf(PHYSICS_SCHEMA)}
                onChange={(next) => store.setValues(PHYSICS_AXIS, next)}
                isDirty={(path) => store.isDirty(PHYSICS_AXIS, path)}
                onReset={(path) => store.resetField(PHYSICS_AXIS, path)}
            />
        </>
    )
}
