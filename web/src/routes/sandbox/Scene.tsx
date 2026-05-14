import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
    tunableSceneLoaders,
    type TunableSceneModule,
} from '../../canvas/scenes/tunable'
import { Tuner } from '../../sandbox/particles/Tuner'

export default function SandboxScene() {
    const { id } = useParams<{ id: string }>()
    const loader = id ? tunableSceneLoaders[id] : undefined
    const [mod, setMod] = useState<TunableSceneModule | null>(null)

    useEffect(() => {
        if (!loader) {
            setMod(null)
            return
        }
        let cancelled = false
        loader().then((m) => {
            if (!cancelled) setMod(m)
        })
        return () => {
            cancelled = true
        }
    }, [loader])

    if (!loader) return <NoTunerPanel id={id} />
    if (!mod) return <LoadingPanel />
    return <Tuner schema={mod.SCHEMA} Scene={mod.Scene} />
}

const fullScreen: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    background: '#0a0a12',
    color: '#c8dde8',
    fontFamily: 'monospace',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: 24,
    boxSizing: 'border-box',
}

function NoTunerPanel({ id }: { id?: string }) {
    return (
        <div style={fullScreen}>
            <div>
                Scene <code style={{ color: '#5fb6c4' }}>{id ?? '(missing)'}</code> has
                no tunable schema.
            </div>
        </div>
    )
}

function LoadingPanel() {
    return <div style={fullScreen}>Loading scene…</div>
}
