import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { DEFAULT_PARAMS, SubdivisionScene, type SubdivisionParams } from '../../canvas/scenes/geometric-subdivision'
import { TunePanel, type FieldDef } from './TunePanel'

const FIELDS: FieldDef[] = [
    { key: 'minDepth', label: 'Min depth', type: 'number', min: 1, max: 5, step: 1 },
    { key: 'maxDepth', label: 'Max depth', type: 'number', min: 2, max: 7, step: 1 },
    { key: 'noiseScale', label: 'Noise scale', type: 'range', min: 0.5, max: 8.0, step: 0.1 },
    { key: 'evolutionSpeed', label: 'Evolution speed', type: 'range', min: 0.0, max: 0.3, step: 0.005 },
    { key: 'lineWidth', label: 'Line width', type: 'range', min: 0.01, max: 0.15, step: 0.005 },
    { key: 'colorA', label: 'Cell fill', type: 'color' },
    { key: 'colorB', label: 'Line color', type: 'color' },
]

export default function SubdivisionTune() {
    const [params, setParams] = useState<SubdivisionParams>(() => ({ ...DEFAULT_PARAMS }))

    function handleChange(patch: Partial<SubdivisionParams>) {
        setParams((prev) => ({ ...prev, ...patch }))
    }

    function handleDump() {
        console.log('SubdivisionParams:', JSON.stringify(params, null, 2))
    }

    return (
        <div style={{ width: '100vw', height: '100vh', background: params.colorA }}>
            <Canvas
                gl={{ antialias: false, powerPreference: 'low-power' }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <SubdivisionScene params={params} />
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
