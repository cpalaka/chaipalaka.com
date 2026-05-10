import { useCallback, useRef, useState } from 'react'
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
    const [playgroundMinimized, setPlaygroundMinimized] = useState(false)

    const playgroundCardRef = useRef<HTMLElement | null>(null)
    const playgroundChipRef = useRef<HTMLButtonElement | null>(null)

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

    const handleMinimize = useCallback(() => { flipMinimize() }, [])
    const handleRestore = useCallback(() => { flipRestore() }, [])

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
                        <FrameMock
                            config={config}
                            minimized={playgroundMinimized}
                            onRestore={handleRestore}
                            chipRef={playgroundChipRef}
                        />
                        <Playground
                            minimized={playgroundMinimized}
                            onMinimize={handleMinimize}
                            cardRef={playgroundCardRef}
                        />
                    </div>
                </div>
            </div>
        </PhysicsProvider>
    )
}
