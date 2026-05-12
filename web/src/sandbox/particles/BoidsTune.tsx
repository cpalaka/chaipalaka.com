import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { DEFAULT_PARAMS, BoidsScene, type BoidsParams } from '../../canvas/scenes/particles-boids'
import { TunePanel, type FieldDef } from './TunePanel'

const FIELDS: FieldDef[] = [
    { key: 'count', label: 'Count', type: 'number', min: 500, max: 10000, step: 500 },
    { key: 'pointSize', label: 'Point size', type: 'range', min: 0.001, max: 0.015, step: 0.0005 },
    { key: 'perceptionRadius', label: 'Perception radius', type: 'range', min: 0.02, max: 0.3, step: 0.01 },
    { key: 'separationWeight', label: 'Separation', type: 'range', min: 0, max: 4, step: 0.1 },
    { key: 'alignmentWeight', label: 'Alignment', type: 'range', min: 0, max: 4, step: 0.1 },
    { key: 'cohesionWeight', label: 'Cohesion', type: 'range', min: 0, max: 4, step: 0.1 },
    { key: 'maxSpeed', label: 'Max speed', type: 'range', min: 0.05, max: 1.0, step: 0.05 },
    { key: 'maxForce', label: 'Max force', type: 'range', min: 0.1, max: 2.0, step: 0.1 },
    { key: 'colorA', label: 'Background color', type: 'color' },
    { key: 'colorB', label: 'Accent color', type: 'color' },
]

export default function BoidsTune() {
    const [params, setParams] = useState<BoidsParams>(() => ({ ...DEFAULT_PARAMS }))

    function handleChange(patch: Partial<BoidsParams>) {
        setParams((prev) => ({ ...prev, ...patch }))
    }

    function handleDump() {
        console.log('BoidsParams:', JSON.stringify(params, null, 2))
    }

    return (
        <div style={{ width: '100vw', height: '100vh', background: params.colorA }}>
            <Canvas
                key={params.count}
                gl={{ antialias: false, powerPreference: 'low-power' }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <BoidsScene params={params} />
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
