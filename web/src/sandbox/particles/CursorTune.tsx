import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { DEFAULT_PARAMS, CursorScene, type CursorParams } from '../../canvas/scenes/particles-cursor'
import { TunePanel, type FieldDef } from './TunePanel'

const FIELDS: FieldDef[] = [
    { key: 'cols', label: 'Columns', type: 'number', min: 20, max: 300, step: 10 },
    { key: 'rows', label: 'Rows', type: 'number', min: 20, max: 200, step: 10 },
    { key: 'pointSize', label: 'Point size', type: 'range', min: 0.001, max: 0.015, step: 0.0005 },
    { key: 'repelRadius', label: 'Repel radius', type: 'range', min: 0.05, max: 0.5, step: 0.01 },
    { key: 'repelStrength', label: 'Repel strength', type: 'range', min: 0.01, max: 0.2, step: 0.005 },
    { key: 'returnSpeed', label: 'Return speed', type: 'range', min: 0.5, max: 15, step: 0.5 },
    { key: 'restBrightness', label: 'Rest brightness', type: 'range', min: 0, max: 1, step: 0.05 },
    { key: 'restAlpha', label: 'Rest alpha', type: 'range', min: 0, max: 1, step: 0.05 },
    { key: 'colorA', label: 'Background color', type: 'color' },
    { key: 'colorB', label: 'Accent color', type: 'color' },
]

export default function CursorTune() {
    const [params, setParams] = useState<CursorParams>(() => ({ ...DEFAULT_PARAMS }))

    function handleChange(patch: Partial<CursorParams>) {
        setParams((prev) => ({ ...prev, ...patch }))
    }

    function handleDump() {
        console.log('CursorParams:', JSON.stringify(params, null, 2))
    }

    // Re-key canvas when grid dimensions change to force geometry rebuild
    const canvasKey = `${params.cols}x${params.rows}`

    return (
        <div style={{ width: '100vw', height: '100vh', background: params.colorA }}>
            <Canvas
                key={canvasKey}
                gl={{ antialias: false, powerPreference: 'low-power' }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <CursorScene params={params} />
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
