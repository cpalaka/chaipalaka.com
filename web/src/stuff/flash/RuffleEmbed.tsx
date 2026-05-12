import { useEffect, useRef, useState } from 'react'

export const RUFFLE_VERSION = 'nightly-2026-05-12'
const RUFFLE_SCRIPT = `/assets/ruffle/${RUFFLE_VERSION}/ruffle.js`

interface RufflePlayer {
    load: (opts: { url: string }) => Promise<void> | void
    play: () => void
    remove?: () => void
    style?: CSSStyleDeclaration
}

interface RuffleGlobal {
    newest: () => {
        createPlayer: () => RufflePlayer
    }
}

declare global {
    interface Window {
        RufflePlayer?: RuffleGlobal
    }
}

type Loader = () => Promise<RuffleGlobal>

let cachedLoader: Loader = defaultLoader

function defaultLoader(): Promise<RuffleGlobal> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('Ruffle requires a browser environment'))
            return
        }
        if (window.RufflePlayer) {
            resolve(window.RufflePlayer)
            return
        }
        const existing = document.head.querySelector<HTMLScriptElement>(
            `script[data-ruffle]`,
        )
        const onReady = () => {
            if (window.RufflePlayer) resolve(window.RufflePlayer)
            else reject(new Error('Ruffle loaded but window.RufflePlayer missing'))
        }
        if (existing) {
            existing.addEventListener('load', onReady, { once: true })
            existing.addEventListener('error', () => reject(new Error('Ruffle script error')), { once: true })
            return
        }
        const script = document.createElement('script')
        script.src = RUFFLE_SCRIPT
        script.async = true
        script.setAttribute('data-ruffle', '')
        script.addEventListener('load', onReady, { once: true })
        script.addEventListener('error', () => reject(new Error('Ruffle script error')), { once: true })
        document.head.appendChild(script)
    })
}

let loaderPromise: Promise<RuffleGlobal> | null = null

function loadRuffle(): Promise<RuffleGlobal> {
    if (!loaderPromise) loaderPromise = cachedLoader()
    return loaderPromise
}

export function __resetRuffleLoaderForTests(custom?: Loader) {
    loaderPromise = null
    cachedLoader = custom ?? defaultLoader
}

export interface RuffleEmbedProps {
    swfUrl: string
    width: number
    height: number
}

export function RuffleEmbed({ swfUrl, width, height }: RuffleEmbedProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const playerRef = useRef<RufflePlayer | null>(null)
    const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'failed'>('loading')

    useEffect(() => {
        let cancelled = false
        loadRuffle()
            .then((ruffle) => {
                if (cancelled) return
                const player = ruffle.newest().createPlayer()
                playerRef.current = player
                if (containerRef.current) containerRef.current.appendChild(player as unknown as Node)
                if (player.style) {
                    player.style.width = `${width}px`
                    player.style.height = `${height}px`
                }
                if (import.meta.env.DEV) {
                    const el = player as unknown as HTMLElement
                    el.addEventListener('loadedmetadata', () => {
                        // eslint-disable-next-line no-console
                        console.log(`[Ruffle] ${swfUrl}`, (player as unknown as { metadata?: unknown }).metadata)
                    })
                }
                setStatus('ready')
            })
            .catch(() => {
                if (!cancelled) setStatus('failed')
            })
        return () => {
            cancelled = true
            playerRef.current?.remove?.()
            playerRef.current = null
        }
    }, [width, height])

    async function handlePlay() {
        const player = playerRef.current
        if (!player) return
        await player.load({ url: swfUrl })
        player.play()
        setStatus('playing')
    }

    if (status === 'failed') {
        return (
            <div
                role="alert"
                style={{ width, height, display: 'grid', placeItems: 'center', padding: 16 }}
            >
                This animation requires JavaScript and a modern browser.
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', width, height }}
        >
            {status !== 'playing' && (
                <button
                    type="button"
                    aria-label="Play"
                    disabled={status === 'loading'}
                    onClick={handlePlay}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        border: 'none',
                        cursor: status === 'loading' ? 'default' : 'pointer',
                        font: 'inherit',
                        zIndex: 1,
                    }}
                >
                    <span aria-hidden style={{ fontSize: 64, lineHeight: 1 }}>▶</span>
                    <span style={{ position: 'absolute', clipPath: 'inset(50%)' }}>Play</span>
                </button>
            )}
        </div>
    )
}
