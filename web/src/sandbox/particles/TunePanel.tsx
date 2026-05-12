import { memo } from 'react'

export type FieldDef =
    | { key: string; label: string; type: 'range'; min: number; max: number; step: number }
    | { key: string; label: string; type: 'number'; min?: number; max?: number; step?: number }
    | { key: string; label: string; type: 'color' }

interface Props<T extends Record<string, unknown>> {
    fields: FieldDef[]
    params: T
    onChange: (patch: Partial<T>) => void
    onDump: () => void
}

const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 260,
    height: '100vh',
    overflowY: 'auto',
    background: 'rgba(10,10,18,0.88)',
    backdropFilter: 'blur(8px)',
    color: '#e0e8f0',
    fontFamily: 'monospace',
    fontSize: 12,
    padding: '16px 12px',
    boxSizing: 'border-box',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
}

const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
}

const labelStyle: React.CSSProperties = {
    color: '#8ab4d0',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontSize: 10,
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#e0e8f0',
    padding: '4px 6px',
    borderRadius: 3,
    fontFamily: 'monospace',
    fontSize: 12,
    boxSizing: 'border-box',
}

const dumpStyle: React.CSSProperties = {
    marginTop: 8,
    padding: '8px 0',
    background: 'rgba(91,182,196,0.25)',
    border: '1px solid #5fb6c4',
    color: '#5fb6c4',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: '0.04em',
}

function TunePanelInner<T extends Record<string, unknown>>({
    fields,
    params,
    onChange,
    onDump,
}: Props<T>) {
    return (
        <div style={panelStyle}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#c8dde8' }}>
                Tune Panel
            </div>
            {fields.map((field) => {
                const value = params[field.key]
                if (field.type === 'color') {
                    return (
                        <div key={field.key} style={rowStyle}>
                            <label style={labelStyle}>{field.label}</label>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={value as string}
                                    onChange={(e) =>
                                        onChange({ [field.key]: e.target.value } as Partial<T>)
                                    }
                                    style={{ width: 36, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                                />
                                <span style={{ color: '#a0b8c8' }}>{value as string}</span>
                            </div>
                        </div>
                    )
                }
                if (field.type === 'range') {
                    return (
                        <div key={field.key} style={rowStyle}>
                            <label style={labelStyle}>
                                {field.label} — <span style={{ color: '#c8dde8' }}>{(value as number).toFixed(4)}</span>
                            </label>
                            <input
                                type="range"
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                value={value as number}
                                onChange={(e) =>
                                    onChange({ [field.key]: parseFloat(e.target.value) } as Partial<T>)
                                }
                                style={{ width: '100%', accentColor: '#5fb6c4' }}
                            />
                        </div>
                    )
                }
                // number
                return (
                    <div key={field.key} style={rowStyle}>
                        <label style={labelStyle}>{field.label}</label>
                        <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step ?? 1}
                            value={value as number}
                            onChange={(e) =>
                                onChange({ [field.key]: parseFloat(e.target.value) } as Partial<T>)
                            }
                            style={inputStyle}
                        />
                    </div>
                )
            })}
            <button onClick={onDump} style={dumpStyle}>
                Dump params →console
            </button>
        </div>
    )
}

export const TunePanel = memo(TunePanelInner) as typeof TunePanelInner
