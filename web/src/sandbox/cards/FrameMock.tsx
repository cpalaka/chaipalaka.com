import { useState, type RefObject } from 'react'
import type { SandboxConfig } from './state'
import { MinimizedStrip } from './MinimizedStrip'

const SECTION_OPTIONS = ['/', '/blog', '/lifelog', '/portfolio'] as const

interface FrameMockProps {
    config: SandboxConfig
    minimized: boolean
    onRestore: () => void
    chipRef?: RefObject<HTMLButtonElement | null>
}

export function FrameMock({ config, minimized, onRestore, chipRef }: FrameMockProps) {
    const [currentPage, setCurrentPage] = useState<string>('/')

    return (
        <div
            className="frame-mock"
            data-edge={config.frameEdge}
            aria-label="Frame chrome mock"
        >
            <div className="frame-bar">
                <div className="frame-bar__title">
                    <span className="frame-bar__site-name">chaipalaka</span>
                    <span className="frame-bar__current-page">{currentPage}</span>
                </div>

                <div className="frame-bar__divider" aria-hidden="true" />

                <nav className="frame-bar__nav" aria-label="Section nav (sandbox only)">
                    {SECTION_OPTIONS.map((s) => (
                        <button
                            key={s}
                            className="frame-bar__nav-btn"
                            data-active={currentPage === s ? 'true' : 'false'}
                            onClick={() => setCurrentPage(s)}
                            type="button"
                        >
                            {s}
                        </button>
                    ))}
                </nav>

                <div className="frame-bar__divider" aria-hidden="true" />

                <MinimizedStrip
                    hasPlayground={minimized}
                    animMechanism={config.animMechanism}
                    onRestorePlayground={onRestore}
                    chipRef={chipRef}
                />
            </div>
        </div>
    )
}
