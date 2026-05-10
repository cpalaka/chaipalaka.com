import type { SandboxConfig, FlavorKey } from './state'

interface FlavorDef {
    key: FlavorKey
    label: string
    tag: string
    light: { bg: string; fg: string; accent: string; border: string; shadow: string; font: string }
    dark: { bg: string; fg: string; accent: string; border: string; shadow: string; font: string }
}

const FLAVORS: FlavorDef[] = [
    {
        key: 'raw',
        label: 'Raw HTML',
        tag: 'Gumroad-style',
        light: {
            bg: '#fffbe6', fg: '#111', accent: '#ffe600',
            border: '3px solid #111', shadow: '5px 5px 0 #111', font: 'ui-sans-serif, system-ui, sans-serif',
        },
        dark: {
            bg: '#111', fg: '#fffbe6', accent: '#ffe600',
            border: '3px solid #ffe600', shadow: '5px 5px 0 #ffe600', font: 'ui-sans-serif, system-ui, sans-serif',
        },
    },
    {
        key: 'neo',
        label: 'Neobrutalism',
        tag: 'Playful + thick',
        light: {
            bg: '#fff9f9', fg: '#111', accent: '#ff6b6b',
            border: '4px solid #111', shadow: '6px 6px 0 #ff6b6b', font: 'ui-sans-serif, system-ui, sans-serif',
        },
        dark: {
            bg: '#1a1a1a', fg: '#f5f5f5', accent: '#ff6b6b',
            border: '4px solid #ff6b6b', shadow: '6px 6px 0 #ff6b6b', font: 'ui-sans-serif, system-ui, sans-serif',
        },
    },
    {
        key: 'swiss',
        label: 'Swiss Grid',
        tag: 'Restrained',
        light: {
            bg: '#f8f8f8', fg: '#000', accent: '#e60000',
            border: '2px solid #000', shadow: 'none', font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        },
        dark: {
            bg: '#0a0a0a', fg: '#f8f8f8', accent: '#e60000',
            border: '2px solid #f8f8f8', shadow: 'none', font: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        },
    },
    {
        key: 'nineties',
        label: '90s Web',
        tag: 'Lo-fi + rough',
        light: {
            bg: '#d4d0c8', fg: '#000', accent: '#000080',
            border: '2px solid #808080', shadow: 'inset 2px 2px 0 #fff, inset -2px -2px 0 #808080',
            font: "'Times New Roman', ui-serif, serif",
        },
        dark: {
            bg: '#0c0c0c', fg: '#00ff00', accent: '#00ff00',
            border: '2px solid #00ff00', shadow: '0 0 6px #00ff00', font: "'Courier New', ui-monospace, monospace",
        },
    },
]

interface FlavorStripProps {
    config: SandboxConfig
    onChange: (cfg: SandboxConfig) => void
}

export function FlavorStrip({ config, onChange }: FlavorStripProps) {
    return (
        <div className="flavor-strip">
            {FLAVORS.map((f) => {
                const style = config.colorMode === 'dark' ? f.dark : f.light
                const isActive = config.flavor === f.key
                return (
                    <div
                        key={f.key}
                        className="flavor-card"
                        data-active={isActive ? 'true' : 'false'}
                        onClick={() => onChange({ ...config, flavor: f.key })}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ')
                                onChange({ ...config, flavor: f.key })
                        }}
                    >
                        <div className="flavor-card__label">{f.label}</div>
                        <div
                            className="flavor-card__demo"
                            style={{
                                background: style.bg,
                                color: style.fg,
                                border: style.border,
                                boxShadow: style.shadow,
                                fontFamily: style.font,
                            }}
                        >
                            <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: style.fg, fontFamily: style.font }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, background: style.accent, marginRight: 4, verticalAlign: 'middle' }} />
                                {f.tag}
                            </h4>
                            <p style={{ margin: 0, fontSize: 11, opacity: 0.85, fontFamily: style.font }}>
                                Bold. Stark. No apologies.
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
