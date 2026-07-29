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
    // Second #418 source, from the other direction (task-044): Caddy serves the
    // one prerendered `dist/404/index.html` at *whatever* URL missed, so the
    // pathname baked into that file ("/404") can never match the hydrating
    // client's. Unlike the trailing-slash case above there is no normalization
    // that makes them agree, so the check is suppressed and the text is
    // corrected after mount instead. See the `key` on the indicator below.
    const [hydrated, setHydrated] = useState(false)
    useEffect(() => setHydrated(true), [])
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

    return (
        <header role="banner" className="frame-bar">
            <div className="frame-bar__title">
                <Link
                    to="/"
                    viewTransition
                    className="frame-bar__site-name"
                    data-active={pathname === '/' ? 'true' : 'false'}
                >
                    chaipalaka
                </Link>
                {pathname !== '/' ? (
                    // suppressHydrationWarning stops a mismatch here from making
                    // React discard the whole hydrated root; the key flip then
                    // remounts the span with the live pathname, which is what
                    // actually replaces the "/404" text carried in the shell.
                    // Real routes hydrate with matching text, so the remount is
                    // a no-op for them.
                    <span
                        key={hydrated ? 'live' : 'prerendered'}
                        className="frame-bar__current-page"
                        suppressHydrationWarning
                    >
                        {pathname}
                    </span>
                ) : null}
            </div>

            <div className="frame-bar__divider" aria-hidden="true" />

            <nav aria-label="Section nav" className="frame-bar__nav">
                {SECTIONS.map((s) => (
                    // Same hazard as the path indicator, and it needs the same
                    // remount: the 404 shell ships data-active="false" on every
                    // link, but served at /lifelog/nope the client computes
                    // "true". React does not reconcile attributes against the
                    // DOM during hydration, and the post-mount re-render sees
                    // an unchanged value, so without the key flip the wrong
                    // link stays highlighted for the life of the page.
                    <Link
                        key={`${s.path}:${hydrated ? 'live' : 'prerendered'}`}
                        to={s.path}
                        viewTransition
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
