import { useCallback, useState } from 'react'
import { PhysicsProvider } from '../../physics/PhysicsContext'
import { DEFAULT_CONFIG, type SandboxConfig } from '../../sandbox/cards/state'
import { encode, decode } from '../../sandbox/cards/snapshot'
import { SandboxChrome } from '../../sandbox/cards/SandboxChrome'
import { Playground } from '../../sandbox/cards/Playground'
import { FrameMock } from '../../sandbox/cards/FrameMock'
import '../../sandbox/cards/tokens.css'

export default function Cards() {
    const [config, setConfig] = useState<SandboxConfig>(() =>
        typeof window !== 'undefined'
            ? decode(window.location.search)
            : DEFAULT_CONFIG,
    )

    const handleSnapshot = useCallback(() => {
        const params = encode(config)
        const search = params.toString()
        const url = window.location.pathname + (search ? `?${search}` : '')
        window.history.replaceState(null, '', url)
        navigator.clipboard.writeText(window.location.href).catch(() => {})
    }, [config])

    return (
        <PhysicsProvider>
            <div
                data-sandbox=""
                data-color-mode={config.colorMode}
                className="sandbox-root"
            >
                <SandboxChrome
                    config={config}
                    onChange={setConfig}
                    onSnapshot={handleSnapshot}
                />
                <div className="sandbox-body">
                    <div className="sandbox-canvas-area">
                        <FrameMock config={config} />
                        <Playground />
                    </div>
                </div>
            </div>
        </PhysicsProvider>
    )
}
