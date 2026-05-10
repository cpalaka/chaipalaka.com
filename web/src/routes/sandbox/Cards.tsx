import { useCallback, useMemo, useState } from 'react'
import { PhysicsProvider } from '../../physics/PhysicsContext'
import { DEFAULT_CONFIG, FONT_FAMILIES, type SandboxConfig } from '../../sandbox/cards/state'
import { encode, decode } from '../../sandbox/cards/snapshot'
import { SandboxChrome } from '../../sandbox/cards/SandboxChrome'
import { FlavorStrip } from '../../sandbox/cards/FlavorStrip'
import { Playground } from '../../sandbox/cards/Playground'
import { ChainMock } from '../../sandbox/cards/ChainMock'
import { ControlPanel } from '../../sandbox/cards/ControlPanel'
import { FrameMock } from '../../sandbox/cards/FrameMock'
import { PlainMinimalFrameMock } from '../../sandbox/cards/PlainMinimalFrameMock'
import '../../sandbox/cards/tokens.css'

function computeCardVars(config: SandboxConfig): Record<string, string> {
    const shadowVal =
        config.shadow === 'none'
            ? 'none'
            : config.shadow === 'hard-offset'
              ? '5px 5px 0 var(--card-border-color)'
              : '0 4px 16px rgba(0,0,0,0.4)'

    return {
        '--card-border-width': `${config.borderWidth}px`,
        '--card-border-style': config.borderStyle,
        '--card-radius': `${config.radius}px`,
        '--card-shadow-val': shadowVal,
        '--card-font-size': `${config.fontSize}px`,
        '--card-line-height': String(config.lineHeight),
        '--card-letter-spacing': `${config.letterSpacing}em`,
        '--card-padding-val': `${config.padding}px`,
        '--card-font-body': FONT_FAMILIES[config.font],
    }
}

export default function Cards() {
    const [config, setConfig] = useState<SandboxConfig>(() =>
        typeof window !== 'undefined'
            ? decode(window.location.search)
            : DEFAULT_CONFIG,
    )
    const [playgroundMinimized, setPlaygroundMinimized] = useState(false)
    const [showPlainMock, setShowPlainMock] = useState(false)

    const handleSnapshot = useCallback(() => {
        const params = encode(config)
        const search = params.toString()
        const url = window.location.pathname + (search ? `?${search}` : '')
        window.history.replaceState(null, '', url)
        navigator.clipboard.writeText(window.location.href).catch(() => {})
    }, [config])

    const cardVars = useMemo(() => computeCardVars(config), [config])

    return (
        <PhysicsProvider>
            <div
                data-sandbox=""
                data-flavor={config.flavor}
                data-color-mode={config.colorMode}
                className="sandbox-root"
                style={cardVars as React.CSSProperties}
            >
                <SandboxChrome
                    config={config}
                    onChange={setConfig}
                    onSnapshot={handleSnapshot}
                    showPlainMock={showPlainMock}
                    onTogglePlainMock={() => setShowPlainMock((p) => !p)}
                />
                <FlavorStrip config={config} onChange={setConfig} />
                <div className="sandbox-body">
                    <div className="sandbox-canvas-area">
                        <FrameMock
                            config={config}
                            minimized={playgroundMinimized}
                            onRestore={() => setPlaygroundMinimized(false)}
                        />
                        <Playground
                            config={config}
                            minimized={playgroundMinimized}
                            onMinimize={() => setPlaygroundMinimized(true)}
                        />
                        <ChainMock config={config} />
                    </div>
                    <ControlPanel config={config} onChange={setConfig} />
                </div>
                {showPlainMock && <PlainMinimalFrameMock />}
            </div>
        </PhysicsProvider>
    )
}
