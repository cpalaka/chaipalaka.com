import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { DEFAULT_PARAMS, ReactionDiffusionScene, type ReactionDiffusionParams } from '../../canvas/scenes/geometric-reaction-diffusion'
import { TunePanel, type FieldDef } from './TunePanel'

const FIELDS: FieldDef[] = [
    { key: 'simRes', label: 'Sim resolution', type: 'number', min: 64, max: 512, step: 64 },
    { key: 'feed', label: 'Feed (F)', type: 'range', min: 0.01, max: 0.08, step: 0.001 },
    { key: 'kill', label: 'Kill (K)', type: 'range', min: 0.04, max: 0.08, step: 0.001 },
    { key: 'diffA', label: 'Diff A', type: 'range', min: 0.1, max: 2.0, step: 0.05 },
    { key: 'diffB', label: 'Diff B', type: 'range', min: 0.05, max: 1.5, step: 0.05 },
    { key: 'stepsPerFrame', label: 'Steps/frame', type: 'number', min: 1, max: 12, step: 1 },
    { key: 'seedCount', label: 'Seed blobs', type: 'number', min: 1, max: 60, step: 1 },
    { key: 'colorA', label: 'Background color', type: 'color' },
    { key: 'colorB', label: 'Pattern color', type: 'color' },
]

export default function ReactionDiffusionTune() {
    const [params, setParams] = useState<ReactionDiffusionParams>(() => ({ ...DEFAULT_PARAMS }))

    function handleChange(patch: Partial<ReactionDiffusionParams>) {
        setParams((prev) => ({ ...prev, ...patch }))
    }

    function handleDump() {
        console.log('ReactionDiffusionParams:', JSON.stringify(params, null, 2))
    }

    // Remount Canvas when simRes changes — geometry rebuild required
    return (
        <div style={{ width: '100vw', height: '100vh', background: params.colorA }}>
            <Canvas
                key={`${params.simRes}-${params.seedCount}`}
                gl={{ antialias: false, powerPreference: 'low-power' }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <ReactionDiffusionScene params={params} />
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
