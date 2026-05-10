import { useState } from 'react'
import type { SandboxConfig } from './state'
import { MinimizedStrip } from './MinimizedStrip'

const SECTION_OPTIONS = ['/', '/blog', '/lifelog', '/portfolio'] as const

interface FrameMockProps {
    config: SandboxConfig
    minimized: boolean
    onRestore: () => void
}

export function FrameMock({ config, minimized, onRestore }: FrameMockProps) {
    const [section, setSection] = useState<string>('/')

    return (
        <div
            className="frame-mock"
            data-edge={config.frameEdge}
            aria-label="Frame chrome mock"
        >
            <div className="frame-bar">
                <span className="frame-bar__site-name">chaipalaka</span>
                <select
                    className="frame-bar__section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        fontFamily: 'inherit',
                        fontSize: 11,
                        cursor: 'pointer',
                    }}
                    title="Fake section indicator (sandbox only)"
                >
                    {SECTION_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>

                <MinimizedStrip
                    hasPlayground={minimized}
                    animMechanism={config.animMechanism}
                    onRestorePlayground={onRestore}
                />
            </div>
        </div>
    )
}
