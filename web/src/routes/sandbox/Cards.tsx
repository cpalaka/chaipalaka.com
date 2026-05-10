import { useCallback, useMemo, useRef, useState } from 'react'
import { PhysicsProvider } from '../../physics/PhysicsContext'
import { DEFAULT_CONFIG, FONT_FAMILIES, type SandboxConfig } from '../../sandbox/cards/state'
import { encode, decode } from '../../sandbox/cards/snapshot'
import { SandboxChrome } from '../../sandbox/cards/SandboxChrome'
import { FlavorStrip } from '../../sandbox/cards/FlavorStrip'
import { Playground } from '../../sandbox/cards/Playground'
import { ChainMock } from '../../sandbox/cards/ChainMock'
import { FreeChainMock } from '../../sandbox/cards/FreeChainMock'
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

    const playgroundCardRef = useRef<HTMLElement | null>(null)
    const playgroundChipRef = useRef<HTMLButtonElement | null>(null)

    function startVT(cb: () => void) {
        if ('startViewTransition' in document) {
            ;(document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(cb)
        } else {
            cb()
        }
    }

    function flipMinimize() {
        const cardEl = playgroundCardRef.current
        const fromRect = cardEl?.getBoundingClientRect() ?? null
        setPlaygroundMinimized(true)
        if (!fromRect) return
        requestAnimationFrame(() => {
            const chipEl = playgroundChipRef.current
            if (!chipEl) return
            const toRect = chipEl.getBoundingClientRect()
            const scaleX = fromRect.width / toRect.width
            const scaleY = fromRect.height / toRect.height
            const dx = fromRect.left - toRect.left
            const dy = fromRect.top - toRect.top
            chipEl.animate(
                [
                    {
                        transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
                        transformOrigin: '0 0',
                        opacity: '0.85',
                    },
                    {
                        transform: 'translate(0, 0) scale(1, 1)',
                        transformOrigin: '0 0',
                        opacity: '1',
                    },
                ],
                { duration: 340, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
            )
        })
    }

    function flipRestore() {
        const chipEl = playgroundChipRef.current
        const fromRect = chipEl?.getBoundingClientRect() ?? null
        setPlaygroundMinimized(false)
        if (!fromRect) return
        requestAnimationFrame(() => {
            const cardEl = playgroundCardRef.current
            if (!cardEl) return
            const toRect = cardEl.getBoundingClientRect()
            const scaleX = fromRect.width / toRect.width
            const scaleY = fromRect.height / toRect.height
            const dx = fromRect.left - toRect.left
            const dy = fromRect.top - toRect.top
            cardEl.animate(
                [
                    {
                        transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
                        transformOrigin: '0 0',
                        opacity: '0.5',
                    },
                    {
                        transform: cardEl.style.transform,
                        transformOrigin: '0 0',
                        opacity: '1',
                    },
                ],
                { duration: 340, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
            )
        })
    }

    const handleMinimize = useCallback(() => {
        if (config.animMechanism === 'vt') { startVT(() => setPlaygroundMinimized(true)); return }
        if (config.animMechanism === 'flip') { flipMinimize(); return }
        setPlaygroundMinimized(true)
    }, [config.animMechanism])

    const handleRestore = useCallback(() => {
        if (config.animMechanism === 'vt') { startVT(() => setPlaygroundMinimized(false)); return }
        if (config.animMechanism === 'flip') { flipRestore(); return }
        setPlaygroundMinimized(false)
    }, [config.animMechanism])

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
                            onRestore={handleRestore}
                            chipRef={playgroundChipRef}
                        />
                        <Playground
                            config={config}
                            minimized={playgroundMinimized}
                            onMinimize={handleMinimize}
                            cardRef={playgroundCardRef}
                        />
                        <ChainMock config={config} />
                        <FreeChainMock config={config} />
                    </div>
                    <ControlPanel config={config} onChange={setConfig} />
                </div>
                {showPlainMock && <PlainMinimalFrameMock />}
            </div>
        </PhysicsProvider>
    )
}
