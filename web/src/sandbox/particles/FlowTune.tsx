import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { DEFAULT_PARAMS, FlowScene, type FlowParams } from '../../canvas/scenes/particles-flow'
import { TunePanel, type FieldDef } from './TunePanel'

const FIELDS: FieldDef[] = [
    { key: 'count', label: 'Count', type: 'number', min: 1000, max: 60000, step: 1000 },
    { key: 'pointSize', label: 'Point size', type: 'range', min: 0.0005, max: 0.008, step: 0.0001 },
    { key: 'fieldScale', label: 'Field scale (swirl size)', type: 'range', min: 0.3, max: 5, step: 0.1 },
    { key: 'fieldSpeed', label: 'Field evolution speed', type: 'range', min: 0.005, max: 0.2, step: 0.005 },
    { key: 'particleSpeed', label: 'Particle speed', type: 'range', min: 0.001, max: 0.02, step: 0.001 },
    { key: 'colorA', label: 'Background color', type: 'color' },
    { key: 'colorB', label: 'Accent color', type: 'color' },
]

export default function FlowTune() {
    const [params, setParams] = useState<FlowParams>(() => ({ ...DEFAULT_PARAMS }))

    function handleChange(patch: Partial<FlowParams>) {
        setParams((prev) => ({ ...prev, ...patch }))
    }

    function handleDump() {
        console.log('FlowParams:', JSON.stringify(params, null, 2))
    }

    return (
        <div style={{ width: '100vw', height: '100vh', background: params.colorA }}>
            <Canvas
                key={params.count}
                gl={{ antialias: false, powerPreference: 'low-power' }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <FlowScene params={params} />
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
