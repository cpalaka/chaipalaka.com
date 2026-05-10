import type {
    SandboxConfig,
    FontKey,
    BorderStyleProp,
    ShadowStyle,
    FlourishMode,
    ResizeMode,
    FrameEdge,
    AnimMechanism,
    ScrollIndicatorStyle,
    ViewportSim,
} from './state'

interface ControlPanelProps {
    config: SandboxConfig
    onChange: (cfg: SandboxConfig) => void
}

function set<K extends keyof SandboxConfig>(
    cfg: SandboxConfig,
    key: K,
    value: SandboxConfig[K],
): SandboxConfig {
    return { ...cfg, [key]: value }
}

function Row({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="control-panel__row">
            <label>{label}</label>
            {children}
        </div>
    )
}

function Sel<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T
    options: readonly { val: T; label: string }[]
    onChange: (v: T) => void
}) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value as T)}>
            {options.map((o) => (
                <option key={o.val} value={o.val}>
                    {o.label}
                </option>
            ))}
        </select>
    )
}

function Num({
    value,
    options,
    onChange,
}: {
    value: number
    options: readonly number[]
    onChange: (v: number) => void
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
        >
            {options.map((o) => (
                <option key={o} value={o}>
                    {o}
                </option>
            ))}
        </select>
    )
}

export function ControlPanel({ config, onChange }: ControlPanelProps) {
    const c = config
    const u = (k: keyof SandboxConfig, v: SandboxConfig[keyof SandboxConfig]) =>
        onChange(set(c, k, v as never))

    return (
        <aside className="control-panel" aria-label="Sandbox controls">
            {/* BORDER */}
            <div className="control-panel__section">
                <div className="control-panel__section-title">Border</div>
                <Row label="Weight">
                    <Num
                        value={c.borderWidth}
                        options={[2, 4, 6]}
                        onChange={(v) => u('borderWidth', v as 2 | 4 | 6)}
                    />
                    <span className="control-panel__val">{c.borderWidth}px</span>
                </Row>
                <Row label="Style">
                    <Sel<BorderStyleProp>
                        value={c.borderStyle}
                        options={[
                            { val: 'solid', label: 'solid' },
                            { val: 'dashed', label: 'dashed' },
                            { val: 'dotted', label: 'dotted' },
                            { val: 'double', label: 'double' },
                        ]}
                        onChange={(v) => u('borderStyle', v)}
                    />
                </Row>
                <Row label="Radius">
                    <Num
                        value={c.radius}
                        options={[0, 2, 4]}
                        onChange={(v) => u('radius', v as 0 | 2 | 4)}
                    />
                    <span className="control-panel__val">{c.radius}px</span>
                </Row>
                <Row label="Shadow">
                    <Sel<ShadowStyle>
                        value={c.shadow}
                        options={[
                            { val: 'none', label: 'none' },
                            { val: 'hard-offset', label: 'hard-offset' },
                            { val: 'soft', label: 'soft' },
                        ]}
                        onChange={(v) => u('shadow', v)}
                    />
                </Row>
            </div>

            {/* TYPOGRAPHY */}
            <div className="control-panel__section">
                <div className="control-panel__section-title">Typography</div>
                <Row label="Font">
                    <Sel<FontKey>
                        value={c.font}
                        options={[
                            { val: 'inter', label: 'Inter' },
                            { val: 'newsreader', label: 'Newsreader' },
                            { val: 'ibm-plex-sans', label: 'IBM Plex Sans' },
                            { val: 'ibm-plex-mono', label: 'IBM Plex Mono' },
                            { val: 'jetbrains-mono', label: 'JetBrains Mono' },
                        ]}
                        onChange={(v) => u('font', v)}
                    />
                </Row>
                <Row label="Size">
                    <Num
                        value={c.fontSize}
                        options={[14, 16, 18, 20]}
                        onChange={(v) => u('fontSize', v as 14 | 16 | 18 | 20)}
                    />
                    <span className="control-panel__val">{c.fontSize}px</span>
                </Row>
                <Row label="Leading">
                    <Num
                        value={c.lineHeight}
                        options={[1.3, 1.5, 1.6, 1.8]}
                        onChange={(v) => u('lineHeight', v as 1.3 | 1.5 | 1.6 | 1.8)}
                    />
                </Row>
                <Row label="Tracking">
                    <Sel
                        value={String(c.letterSpacing)}
                        options={[
                            { val: '-0.01', label: 'tight' },
                            { val: '0', label: 'normal' },
                            { val: '0.02', label: 'loose' },
                            { val: '0.05', label: 'wide' },
                        ]}
                        onChange={(v) =>
                            u('letterSpacing', Number(v) as -0.01 | 0 | 0.02 | 0.05)
                        }
                    />
                </Row>
            </div>

            {/* DENSITY */}
            <div className="control-panel__section">
                <div className="control-panel__section-title">Density</div>
                <Row label="Padding">
                    <Num
                        value={c.padding}
                        options={[12, 24, 40]}
                        onChange={(v) => u('padding', v as 12 | 24 | 40)}
                    />
                    <span className="control-panel__val">{c.padding}px</span>
                </Row>
            </div>

            {/* SHADER FLOURISH */}
            <div className="control-panel__section">
                <div className="control-panel__section-title">Shader Flourish</div>
                <Row label="Mode">
                    <Sel<FlourishMode>
                        value={c.flourish}
                        options={[
                            { val: 'off', label: 'off' },
                            { val: 'static-gradient', label: 'static grad' },
                            { val: 'wavy-edge', label: 'wavy edge' },
                            { val: 'noise-field', label: 'noise field' },
                        ]}
                        onChange={(v) => u('flourish', v)}
                    />
                </Row>
                {c.flourish !== 'off' && (
                    <div style={{ fontSize: 9, color: 'var(--color-fg-muted)', marginTop: 4 }}>
                        Cap: ≤3 WebGL contexts visible
                    </div>
                )}
            </div>

            {/* RESIZE */}
            <div className="control-panel__section">
                <div className="control-panel__section-title">Resize</div>
                <Row label="Handles">
                    <Sel<ResizeMode>
                        value={c.resizeMode}
                        options={[
                            { val: '8-handle', label: '8 handles' },
                            { val: '4-corner', label: '4 corners' },
                        ]}
                        onChange={(v) => u('resizeMode', v)}
                    />
                </Row>
                <Row label="Spring">
                    <input
                        type="checkbox"
                        checked={c.springDuringResize}
                        onChange={(e) => u('springDuringResize', e.target.checked)}
                    />
                    <span style={{ marginLeft: 4 }}>during resize</span>
                </Row>
                <Row label="Snap">
                    <input
                        type="checkbox"
                        checked={c.snapToGrid}
                        onChange={(e) => u('snapToGrid', e.target.checked)}
                    />
                    <span style={{ marginLeft: 4 }}>to 8px grid</span>
                </Row>
            </div>

            {/* FRAME */}
            <div className="control-panel__section">
                <div className="control-panel__section-title">Frame</div>
                <Row label="Edge">
                    <Sel<FrameEdge>
                        value={c.frameEdge}
                        options={[
                            { val: 'top', label: 'top' },
                            { val: 'bottom', label: 'bottom' },
                        ]}
                        onChange={(v) => u('frameEdge', v)}
                    />
                </Row>
            </div>

            {/* ANIMATION */}
            <div className="control-panel__section">
                <div className="control-panel__section-title">Animation</div>
                <Row label="Minimize">
                    <Sel<AnimMechanism>
                        value={c.animMechanism}
                        options={[
                            { val: 'flip', label: 'FLIP' },
                            { val: 'vt', label: 'View Transition' },
                        ]}
                        onChange={(v) => u('animMechanism', v)}
                    />
                </Row>
            </div>

            {/* SCROLL INDICATOR */}
            <div className="control-panel__section">
                <div className="control-panel__section-title">Scroll Indicator</div>
                <Row label="Style">
                    <Sel<ScrollIndicatorStyle>
                        value={c.scrollIndicator}
                        options={[
                            { val: 'gradient-fade', label: 'gradient fade' },
                            { val: 'dot', label: 'dots' },
                            { val: 'arrow', label: 'arrow' },
                            { val: 'progress-line', label: 'progress bar' },
                        ]}
                        onChange={(v) => u('scrollIndicator', v)}
                    />
                </Row>
            </div>

            {/* VIEWPORT */}
            <div className="control-panel__section">
                <div className="control-panel__section-title">Viewport Sim</div>
                <Row label="Width">
                    <Sel<ViewportSim>
                        value={c.viewportSim}
                        options={[
                            { val: 'free', label: 'free' },
                            { val: 'mobile', label: 'mobile 375' },
                            { val: 'tablet', label: 'tablet 768' },
                            { val: 'desktop', label: 'desktop 1280' },
                        ]}
                        onChange={(v) => u('viewportSim', v)}
                    />
                </Row>
            </div>
        </aside>
    )
}
