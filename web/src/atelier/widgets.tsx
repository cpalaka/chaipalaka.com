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
    /** Per-field dirty flag, keyed by dot-joined leaf path (group-aware). */
    isDirty?: (path: string) => boolean
    /** Per-field revert, keyed like {@link Props.isDirty}. Rendered only for dirty fields. */
    onReset?: (path: string) => void
    /** Internal — dot-path prefix accumulated through group recursion. */
    pathPrefix?: string
}

const resetButtonStyle: CSSProperties = {
    marginLeft: 6,
    padding: '0 4px',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 3,
    color: '#e8b04a',
    fontSize: 10,
    lineHeight: '14px',
    cursor: 'pointer',
}

function ResetButton({
    label,
    path,
    onReset,
}: {
    label: string
    path: string
    onReset: (path: string) => void
}) {
    return (
        <button
            type="button"
            aria-label={`Reset ${label}`}
            style={resetButtonStyle}
            onClick={(e) => {
                // inside a <label> — don't let the click activate the input
                e.preventDefault()
                e.stopPropagation()
                onReset(path)
            }}
        >
            ↺
        </button>
    )
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

/** ~100 positions per decade — smooth without float noise in the track. */
const LOG_SLIDER_STEP = 0.01

/** Slider position (log10 space) → value, rounded to 3 significant figures
 * so working values and write-back payloads stay human-readable. */
function logSliderValue(pos: number): number {
    return Number(Math.pow(10, pos).toPrecision(3))
}

/** Tiny magnitudes read better in e-notation (same threshold as the
 * write-back generator's fmtNum). */
function fmtRangeValue(v: number): string {
    return v !== 0 && Math.abs(v) < 1e-3 ? v.toExponential() : String(v)
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

export function TuningFields({
    schema,
    values,
    onChange,
    isDirty,
    onReset,
    pathPrefix = '',
}: Props) {
    const set = (key: string, v: unknown) => onChange({ ...values, [key]: v })
    const reset = (path: string, label: string) =>
        isDirty?.(path) && onReset ? (
            <ResetButton label={label} path={path} onReset={onReset} />
        ) : null

    return (
        <>
            {fieldsOf(schema).map((field) => {
                const value = values[field.key]
                const path = `${pathPrefix}${field.key}`
                switch (field.kind) {
                    case 'group':
                        return (
                            <fieldset key={field.key} style={groupStyle}>
                                <legend style={labelTextStyle}>{field.label}</legend>
                                <TuningFields
                                    schema={field.fields}
                                    values={value as Values}
                                    onChange={(next) => set(field.key, next)}
                                    isDirty={isDirty}
                                    onReset={onReset}
                                    pathPrefix={`${path}.`}
                                />
                            </fieldset>
                        )
                    case 'boolean':
                        // reset stays outside the <label> — a button inside a
                        // label click-activates the checkbox
                        return (
                            <div key={field.key} style={{ ...rowStyle, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={value as boolean}
                                        onChange={(e) => set(field.key, e.target.checked)}
                                    />
                                    <span style={labelTextStyle}>{field.label}</span>
                                </label>
                                {reset(path, field.label)}
                            </div>
                        )
                    case 'enum':
                        return (
                            <label key={field.key} style={rowStyle}>
                                <span style={labelTextStyle}>
                                    {field.label}
                                    {reset(path, field.label)}
                                </span>
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
                                <span style={labelTextStyle}>
                                    {field.label}
                                    {reset(path, field.label)}
                                </span>
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
                    case 'range': {
                        const log = field.scale === 'log'
                        return (
                            <label key={field.key} style={rowStyle}>
                                <span style={labelTextStyle}>
                                    {field.label} —{' '}
                                    <span style={{ color: '#c8dde8' }}>
                                        {fmtRangeValue(value as number)}
                                    </span>
                                    {reset(path, field.label)}
                                </span>
                                <input
                                    type="range"
                                    min={log ? Math.log10(field.min) : field.min}
                                    max={log ? Math.log10(field.max) : field.max}
                                    step={log ? LOG_SLIDER_STEP : field.step}
                                    value={log ? Math.log10(value as number) : (value as number)}
                                    onChange={(e) =>
                                        set(
                                            field.key,
                                            log
                                                ? logSliderValue(parseFloat(e.target.value))
                                                : parseFloat(e.target.value),
                                        )
                                    }
                                    style={{ width: '100%', accentColor: '#5fb6c4' }}
                                />
                            </label>
                        )
                    }
                    case 'number':
                        return (
                            <label key={field.key} style={rowStyle}>
                                <span style={labelTextStyle}>
                                    {field.label}
                                    {reset(path, field.label)}
                                </span>
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
