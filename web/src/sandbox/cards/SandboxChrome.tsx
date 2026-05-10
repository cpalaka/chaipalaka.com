import type { SandboxConfig, ColorMode, ViewportSim } from './state'

interface SandboxChromeProps {
    config: SandboxConfig
    onChange: (cfg: SandboxConfig) => void
    onSnapshot: () => void
    showPlainMock: boolean
    onTogglePlainMock: () => void
}

export function SandboxChrome({
    config,
    onChange,
    onSnapshot,
    showPlainMock,
    onTogglePlainMock,
}: SandboxChromeProps) {
    return (
        <header className="sandbox-chrome" aria-label="Sandbox controls bar">
            <span className="sandbox-chrome__title">/sandbox/cards</span>

            <label>
                <span className="sandbox-chrome__label">mode</span>
                <select
                    value={config.colorMode}
                    onChange={(e) =>
                        onChange({ ...config, colorMode: e.target.value as ColorMode })
                    }
                >
                    <option value="dark">dark</option>
                    <option value="light">light</option>
                </select>
            </label>

            <label>
                <span className="sandbox-chrome__label">viewport</span>
                <select
                    value={config.viewportSim}
                    onChange={(e) =>
                        onChange({
                            ...config,
                            viewportSim: e.target.value as ViewportSim,
                        })
                    }
                >
                    <option value="free">free</option>
                    <option value="mobile">375px</option>
                    <option value="tablet">768px</option>
                    <option value="desktop">1280px</option>
                </select>
            </label>

            <button onClick={onTogglePlainMock}>
                {showPlainMock ? 'hide plain mock' : 'plain frame mock'}
            </button>

            <button
                className="sandbox-chrome__snapshot-btn"
                onClick={onSnapshot}
                title="Copy URL with current config to clipboard"
            >
                snapshot ↗
            </button>
        </header>
    )
}
