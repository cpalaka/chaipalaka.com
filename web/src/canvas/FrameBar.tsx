import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
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

export function FrameBar() {
    const { pathname } = useLocation()
    const [settingsOpen, setSettingsOpen] = useState(false)

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
            />

            <div className="frame-bar__settings">
                <button
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
                    <div role="menu" className="frame-bar__settings-menu" />
                ) : null}
            </div>
        </header>
    )
}
