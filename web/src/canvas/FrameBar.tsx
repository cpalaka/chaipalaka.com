import { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useGallery } from './useGallery'
import { useTheme } from '../controls/useTheme'
import { useFrameEdge } from './useFrameEdge'
import { BACKGROUND_SCENES } from './scenes/registry'
import './FrameBar.css'

const SECTIONS = [
    { path: '/blog', label: 'blog' },
    { path: '/lifelog', label: 'lifelog' },
    { path: '/stuff', label: 'stuff' },
] as const

export function isActiveRoute(pathname: string, target: string): boolean {
    if (target === '/') return pathname === '/'
    return pathname === target || pathname.startsWith(target + '/')
}

export function FrameBar() {
    // Caddy's file_server 308-redirects directory URLs to trailing-slash form
    // (/stuff -> /stuff/), while the SSG HTML bakes the slash-less route path
    // into the current-page text. Normalize so both render identically —
    // otherwise hydration fails with React #418 (task-015).
    const { pathname: rawPathname } = useLocation()
    const pathname = rawPathname.replace(/\/+$/, '') || '/'
    const [settingsOpen, setSettingsOpen] = useState(false)
    const { active, setActive } = useGallery()
    const { theme, cycleTheme } = useTheme()
    const { edge, setEdge } = useFrameEdge()

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

    // `/` is intentionally a chromeless placeholder (issue #148). Revert by
    // deleting this guard when V2 lands and the route regains nav.
    if (pathname === '/') return null

    return (
        <header role="banner" className="frame-bar">
            <div className="frame-bar__title">
                <Link
                    to="/"
                    className="frame-bar__site-name"
                    data-active={pathname === '/' ? 'true' : 'false'}
                >
                    chaipalaka
                </Link>
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
                                {BACKGROUND_SCENES.map((scene) => (
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

                    </div>
                ) : null}
            </div>
        </header>
    )
}
