import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { DEFAULT_PARAMS, VoronoiScene, type VoronoiParams } from '../../canvas/scenes/geometric-voronoi'
import { TunePanel, type FieldDef } from './TunePanel'

const FIELDS: FieldDef[] = [
    { key: 'count', label: 'Site count', type: 'number', min: 4, max: 64, step: 1 },
    { key: 'driftSpeed', label: 'Drift speed', type: 'range', min: 0.005, max: 0.3, step: 0.005 },
    { key: 'edgeWidth', label: 'Edge width', type: 'range', min: 0.001, max: 0.04, step: 0.001 },
    { key: 'colorA', label: 'Cell fill', type: 'color' },
    { key: 'colorB', label: 'Cell tint (alt)', type: 'color' },
    { key: 'colorBorder', label: 'Border color', type: 'color' },
]

export default function VoronoiTune() {
    const [params, setParams] = useState<VoronoiParams>(() => ({ ...DEFAULT_PARAMS }))

    function handleChange(patch: Partial<VoronoiParams>) {
        setParams((prev) => ({ ...prev, ...patch }))
    }

    function handleDump() {
        console.log('VoronoiParams:', JSON.stringify(params, null, 2))
    }

    return (
        <div style={{ width: '100vw', height: '100vh', background: params.colorA }}>
            <Canvas
                gl={{ antialias: false, powerPreference: 'low-power' }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <VoronoiScene params={params} />
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
