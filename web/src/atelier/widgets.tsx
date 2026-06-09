import type { CSSProperties } from 'react'
import { fieldsOf, type TuningSchema } from '../canvas/scenes/paramSchema'

// Values are loosely typed at the widget boundary: the Atelier stores working
// state as plain records (persisted to localStorage), so widgets render from
// the schema and trust it for structure.
type Values = Record<string, unknown>

interface Props {
    schema: TuningSchema
    values: Values
    onChange: (next: Values) => void
}

const rowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontFamily: 'monospace',
    fontSize: 12,
}

const labelTextStyle: CSSProperties = {
    color: '#8ab4d0',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontSize: 10,
}

const inputStyle: CSSProperties = {
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

const groupStyle: CSSProperties = {
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 3,
    padding: '8px 8px 10px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
}

export function TuningFields({ schema, values, onChange }: Props) {
    const set = (key: string, v: unknown) => onChange({ ...values, [key]: v })

    return (
        <>
            {fieldsOf(schema).map((field) => {
                const value = values[field.key]
                switch (field.kind) {
                    case 'group':
                        return (
                            <fieldset key={field.key} style={groupStyle}>
                                <legend style={labelTextStyle}>{field.label}</legend>
                                <TuningFields
                                    schema={field.fields}
                                    values={value as Values}
                                    onChange={(next) => set(field.key, next)}
                                />
                            </fieldset>
                        )
                    case 'boolean':
                        return (
                            <label key={field.key} style={{ ...rowStyle, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={value as boolean}
                                    onChange={(e) => set(field.key, e.target.checked)}
                                />
                                <span style={labelTextStyle}>{field.label}</span>
                            </label>
                        )
                    case 'enum':
                        return (
                            <label key={field.key} style={rowStyle}>
                                <span style={labelTextStyle}>{field.label}</span>
                                <select
                                    value={value as string}
                                    onChange={(e) => set(field.key, e.target.value)}
                                    style={inputStyle}
                                >
                                    {field.options.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )
                    case 'color':
                        return (
                            <label key={field.key} style={rowStyle}>
                                <span style={labelTextStyle}>{field.label}</span>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={value as string}
                                        onChange={(e) => set(field.key, e.target.value)}
                                        style={{ width: 36, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                                    />
                                    <span style={{ color: '#a0b8c8' }}>{value as string}</span>
                                </div>
                            </label>
                        )
                    case 'range':
                        return (
                            <label key={field.key} style={rowStyle}>
                                <span style={labelTextStyle}>
                                    {field.label} —{' '}
                                    <span style={{ color: '#c8dde8' }}>{value as number}</span>
                                </span>
                                <input
                                    type="range"
                                    min={field.min}
                                    max={field.max}
                                    step={field.step}
                                    value={value as number}
                                    onChange={(e) => set(field.key, parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: '#5fb6c4' }}
                                />
                            </label>
                        )
                    case 'number':
                        return (
                            <label key={field.key} style={rowStyle}>
                                <span style={labelTextStyle}>{field.label}</span>
                                <input
                                    type="number"
                                    min={field.min}
                                    max={field.max}
                                    step={field.step}
                                    value={value as number}
                                    onChange={(e) => set(field.key, parseFloat(e.target.value))}
                                    style={inputStyle}
                                />
                            </label>
                        )
                }
            })}
        </>
    )
}
