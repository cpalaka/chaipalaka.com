import { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useGallery } from './useGallery'
import { useTheme } from '../controls/useTheme'
import { useFrameEdge } from './useFrameEdge'
import { useMinimizedEntries, useMinimizedRegistry } from './useMinimizedRegistry'
import { flipMorph } from './flip'
import type { MinimizedEntry } from './MinimizedRegistry'
import manifest from './scenes/manifest.json'
import './FrameBar.css'

const SECTIONS = [
    { path: '/', label: 'home' },
    { path: '/blog', label: 'blog' },
    { path: '/lifelog', label: 'lifelog' },
] as const

export function isActiveRoute(pathname: string, target: string): boolean {
    if (target === '/') return pathname === '/'
    return pathname === target || pathname.startsWith(target + '/')
}

interface MinimizedChipProps {
    entry: MinimizedEntry
    onRestore: (id: string, chipRect: DOMRect) => void
}

function MinimizedChip({ entry, onRestore }: MinimizedChipProps) {
    const chipRef = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        const chipEl = chipRef.current
        if (!chipEl || !entry.fromRect) return
        const fromRect = entry.fromRect
        // FLIP: animate chip in from the card's source rect. Runs once on chip mount.
        requestAnimationFrame(() => {
            flipMorph(fromRect, chipEl, { opacityFrom: 0.85 })
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
        const chipRect = e.currentTarget.getBoundingClientRect()
        onRestore(entry.id, chipRect)
    }

    return (
        <button
            ref={chipRef}
            type="button"
            className="frame-bar__mini-card"
            aria-label={`Restore: ${entry.label}`}
            title={`Restore: ${entry.label}`}
            onClick={handleClick}
        >
            {entry.label}
        </button>
    )
}

export function FrameBar() {
    const { pathname } = useLocation()
    const [settingsOpen, setSettingsOpen] = useState(false)
    const { active, setActive } = useGallery()
    const { theme, cycleTheme } = useTheme()
    const { edge, setEdge } = useFrameEdge()
    const [gravityOn] = useState(false)
    const minimizedEntries = useMinimizedEntries()
    const registry = useMinimizedRegistry()

    const settingsContainerRef = useRef<HTMLDivElement>(null)
    const settingsBtnRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!settingsOpen) return
        const onMouseDown = (e: MouseEvent) => {
            if (!settingsContainerRef.current?.contains(e.target as Node)) {
                setSettingsOpen(false)
            }
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [settingsOpen])

    useEffect(() => {
        if (!settingsOpen) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSettingsOpen(false)
                settingsBtnRef.current?.focus()
            }
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [settingsOpen])

    function handleRestore(id: string, chipRect: DOMRect) {
        registry.restore(id, chipRect)
    }

    return (
        <header role="banner" className="frame-bar">
            <div className="frame-bar__title">
                <span className="frame-bar__site-name">chaipalaka</span>
                {pathname !== '/' ? (
                    <span className="frame-bar__current-page">{pathname}</span>
                ) : null}
            </div>

            <div className="frame-bar__divider" aria-hidden="true" />

            <nav aria-label="Section nav" className="frame-bar__nav">
                {SECTIONS.map((s) => (
                    <Link
                        key={s.path}
                        to={s.path}
                        className="frame-bar__nav-btn"
                        data-active={isActiveRoute(pathname, s.path) ? 'true' : 'false'}
                    >
                        {s.label}
                    </Link>
                ))}
            </nav>

            <div className="frame-bar__divider" aria-hidden="true" />

            <div
                role="region"
                aria-label="Minimized cards"
                aria-live="polite"
                className="frame-bar__minimized-strip"
            >
                {minimizedEntries.map((entry) => (
                    <MinimizedChip key={entry.id} entry={entry} onRestore={handleRestore} />
                ))}
            </div>

            <div ref={settingsContainerRef} className="frame-bar__settings">
                <button
                    ref={settingsBtnRef}
                    type="button"
                    className="frame-bar__settings-btn"
                    aria-label="Site settings"
                    aria-expanded={settingsOpen}
                    aria-haspopup="menu"
                    onClick={() => setSettingsOpen((o) => !o)}
                >
                    ≡
                </button>
                {settingsOpen ? (
                    <div role="menu" className="frame-bar__settings-menu">
                        <div
                            role="group"
                            aria-labelledby="fb-bg-label"
                            className="frame-bar__menu-group"
                        >
                            <label
                                id="fb-bg-label"
                                htmlFor="fb-bg"
                                className="frame-bar__menu-label"
                            >
                                Background
                            </label>
                            <select
                                id="fb-bg"
                                className="frame-bar__menu-select"
                                value={active.id}
                                onChange={(e) => setActive(e.target.value)}
                            >
                                {manifest.map((scene) => (
                                    <option key={scene.id} value={scene.id}>
                                        {scene.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div
                            role="group"
                            aria-labelledby="fb-theme-label"
                            className="frame-bar__menu-group"
                        >
                            <span id="fb-theme-label" className="frame-bar__menu-label">
                                Color mode
                            </span>
                            <button
                                type="button"
                                className="frame-bar__menu-toggle"
                                aria-pressed={theme === 'light'}
                                onClick={cycleTheme}
                            >
                                {theme === 'light' ? 'Light' : 'Dark'}
                            </button>
                        </div>

                        <div
                            role="group"
                            aria-labelledby="fb-edge-label"
                            className="frame-bar__menu-group"
                        >
                            <label
                                id="fb-edge-label"
                                htmlFor="fb-edge"
                                className="frame-bar__menu-label"
                            >
                                Frame edge
                            </label>
                            <select
                                id="fb-edge"
                                className="frame-bar__menu-select"
                                value={edge}
                                onChange={(e) =>
                                    setEdge(e.target.value as 'top' | 'bottom')
                                }
                            >
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                            </select>
                        </div>

                        <div
                            role="group"
                            aria-labelledby="fb-grav-label"
                            className="frame-bar__menu-group"
                        >
                            <span id="fb-grav-label" className="frame-bar__menu-label">
                                Gravity
                            </span>
                            <button
                                type="button"
                                className="frame-bar__menu-toggle"
                                aria-pressed={gravityOn}
                            >
                                {gravityOn ? 'On' : 'Off'}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </header>
    )
}
