import type { SandboxConfig, ColorMode, FrameEdge } from './state'

interface SandboxChromeProps {
    config: SandboxConfig
    onChange: (cfg: SandboxConfig) => void
    onSnapshot: () => void
}

export function SandboxChrome({ config, onChange, onSnapshot }: SandboxChromeProps) {
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
                <span className="sandbox-chrome__label">frame</span>
                <select
                    value={config.frameEdge}
                    onChange={(e) =>
                        onChange({ ...config, frameEdge: e.target.value as FrameEdge })
                    }
                >
                    <option value="bottom">bottom</option>
                    <option value="top">top</option>
                </select>
            </label>

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
