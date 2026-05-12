import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { DEFAULT_PARAMS, StarfieldScene, type StarfieldParams } from '../../canvas/scenes/particles-starfield'
import { TunePanel, type FieldDef } from './TunePanel'

const FIELDS: FieldDef[] = [
    { key: 'count', label: 'Count', type: 'number', min: 1000, max: 100000, step: 1000 },
    { key: 'sizeMin', label: 'Size min', type: 'range', min: 0.0001, max: 0.01, step: 0.0001 },
    { key: 'sizeMax', label: 'Size max', type: 'range', min: 0.001, max: 0.02, step: 0.0001 },
    { key: 'speedMin', label: 'Speed min', type: 'range', min: 0.001, max: 0.1, step: 0.001 },
    { key: 'speedMax', label: 'Speed max', type: 'range', min: 0.005, max: 0.2, step: 0.001 },
    { key: 'colorA', label: 'Background color', type: 'color' },
    { key: 'colorB', label: 'Star color', type: 'color' },
]

export default function StarfieldTune() {
    const [params, setParams] = useState<StarfieldParams>(() => ({ ...DEFAULT_PARAMS }))

    function handleChange(patch: Partial<StarfieldParams>) {
        setParams((prev) => ({ ...prev, ...patch }))
    }

    function handleDump() {
        console.log('StarfieldParams:', JSON.stringify(params, null, 2))
    }

    return (
        <div style={{ width: '100vw', height: '100vh', background: params.colorA }}>
            <Canvas
                key={params.count}
                gl={{ antialias: false, powerPreference: 'low-power' }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <StarfieldScene params={params} />
            </Canvas>
            <TunePanel
                fields={FIELDS}
                params={params as unknown as Record<string, unknown>}
                onChange={handleChange as (p: Partial<Record<string, unknown>>) => void}
                onDump={handleDump}
            />
        </div>
    )
}
