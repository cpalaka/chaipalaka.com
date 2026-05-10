import { useEffect, useRef, useState } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import { useGallery } from '../canvas/useGallery'
import { useTheme } from './useTheme'
import type { PhysicsHandle } from '../physics/PhysicsWorld'
import manifest from '../canvas/scenes/manifest.json'
import './ControlsPanel.css'

const POSITION_STORAGE_KEY = 'chaipalaka.controls.position'
const PANEL_W = 200
const PANEL_H_EXPANDED = 220
const PANEL_H_COLLAPSED = 48
const EDGE_MARGIN = 20

type SavedPosition = { x: number; y: number }

function defaultPosition(): SavedPosition {
    if (typeof window === 'undefined') return { x: 200, y: 500 }
    return {
        x: window.innerWidth - PANEL_W / 2 - EDGE_MARGIN,
        y: window.innerHeight - PANEL_H_EXPANDED / 2 - EDGE_MARGIN,
    }
}

function loadPosition(): SavedPosition {
    if (typeof localStorage === 'undefined') return defaultPosition()
    try {
        const raw = localStorage.getItem(POSITION_STORAGE_KEY)
        if (raw) return JSON.parse(raw) as SavedPosition
    } catch {
        // ignore
    }
    return defaultPosition()
}

function savePosition(pos: SavedPosition) {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos))
    }
}

const THEME_ICONS: Record<string, string> = {
    dark: '🌙',
    light: '☀️',
    system: '⚙️',
}

const THEME_LABELS: Record<string, string> = {
    dark: 'Dark',
    light: 'Light',
    system: 'System',
}

export function ControlsPanel() {
    const world = usePhysicsWorld()
    const { active, setActive } = useGallery()
    const { theme, cycleTheme } = useTheme()
    const [collapsed, setCollapsed] = useState(false)
    const [gravityOn] = useState(false)

    const elRef = useRef<HTMLDivElement | null>(null)
    const handleRef = useRef<PhysicsHandle | null>(null)
    const posRef = useRef<SavedPosition>(loadPosition())

    useEffect(() => {
        const el = elRef.current
        if (!el) return

        const { x, y } = posRef.current
        const h = collapsed ? PANEL_H_COLLAPSED : PANEL_H_EXPANDED
        el.style.width = `${PANEL_W}px`
        el.style.height = `${h}px`
        el.style.transform = `translate(${x - PANEL_W / 2}px, ${y - h / 2}px)`

        const handle = world.registerStatic(
            { x, y },
            { width: PANEL_W, height: h },
            {
                onTransform: ({ x: px, y: py }) => {
                    el.style.transform = `translate(${px - PANEL_W / 2}px, ${py - h / 2}px)`
                },
            },
        )
        handleRef.current = handle

        let dragging = false
        let lastX = 0
        let lastY = 0

        const onPointerDown = (e: PointerEvent) => {
            if ((e.target as Element | null)?.closest('button')) return
            e.preventDefault()
            dragging = true
            lastX = e.clientX
            lastY = e.clientY
            el.setPointerCapture(e.pointerId)
            el.style.cursor = 'grabbing'
        }
        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return
            const dx = e.clientX - lastX
            const dy = e.clientY - lastY
            const cur = world.getPosition(handle)
            const next = { x: cur.x + dx, y: cur.y + dy }
            world.setPosition(handle, next)
            lastX = e.clientX
            lastY = e.clientY
        }
        const onPointerUp = (e: PointerEvent) => {
            if (!dragging) return
            dragging = false
            el.releasePointerCapture(e.pointerId)
            el.style.cursor = 'grab'
            const final = world.getPosition(handle)
            posRef.current = { x: final.x, y: final.y }
            savePosition(posRef.current)
        }

        el.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)

        return () => {
            world.unregister(handle)
            handleRef.current = null
            el.removeEventListener('pointerdown', onPointerDown)
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', onPointerUp)
        }
    }, [world, collapsed])

    return (
        <div
            ref={elRef}
            className={`controls-panel ${collapsed ? 'controls-panel--collapsed' : 'controls-panel--expanded'}`}
            role="toolbar"
            aria-label="Site controls"
        >
            <div className="controls-panel__handle">
                {!collapsed && (
                    <span
                        className="controls-panel__label"
                        style={{ fontSize: 'var(--font-size-xs)' }}
                    >
                        Controls
                    </span>
                )}
                <button
                    className="controls-panel__collapse-btn"
                    onClick={() => setCollapsed((c) => !c)}
                    aria-label={collapsed ? 'Expand controls' : 'Collapse controls'}
                >
                    {collapsed ? '⊞' : '✕'}
                </button>
            </div>

            {!collapsed && (
                <div className="controls-panel__body">
                    <div className="controls-panel__section">
                        <div className="controls-panel__label">Background</div>
                        <div className="controls-panel__bg-row">
                            {manifest.map((scene) => (
                                <button
                                    key={scene.id}
                                    className={`controls-panel__bg-dot${active.id === scene.id ? ' controls-panel__bg-dot--active' : ''}`}
                                    style={{ background: scene.accentColor }}
                                    onClick={() => setActive(scene.id)}
                                    aria-label={`Switch to ${scene.id} background`}
                                    aria-pressed={active.id === scene.id}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="controls-panel__section">
                        <div className="controls-panel__label">Theme</div>
                        <button
                            className="controls-panel__icon-btn"
                            onClick={cycleTheme}
                            aria-label={`Current theme: ${theme}. Click to cycle.`}
                        >
                            {THEME_ICONS[theme]}{' '}
                            <span>{THEME_LABELS[theme]}</span>
                        </button>
                    </div>

                    <div className="controls-panel__section">
                        <div className="controls-panel__label">Gravity</div>
                        <button
                            className={`controls-panel__icon-btn${gravityOn ? ' controls-panel__icon-btn--active' : ''}`}
                            onClick={() => {/* slice 19 */}}
                            aria-label={`Gravity ${gravityOn ? 'on' : 'off'} (coming soon)`}
                        >
                            ⚖️ <span>{gravityOn ? 'On' : 'Off'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
