/**
 * The Atelier inspector shell — full-height right-docked panel: header with
 * theme switch, tabs per axis, scrollable body, working-set + write-back
 * footer. Dev-only (lazy-loaded by AtelierGate); styled with literal values
 * so editing the site's tokens can never restyle the tool doing the editing.
 *
 * The theme switch drives the production ThemeController via useTheme — no
 * parallel theming mechanism (the cards-sandbox mistake, not repeated).
 */

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useTheme } from '../controls/useTheme'
import { ATELIER_ONLY_BUNDLE_MARKER } from './atelier-only-marker'
import { buildTokenEdits } from './tokensBinder'
import { TokensAxis } from './TokensAxis'
import { PhysicsAxis } from './PhysicsAxis'
import {
    ensurePhysicsBinding,
    ensureTokensBinding,
    getAtelierStore,
    useAtelierState,
} from './useAtelier'
import {
    BASE_TOKEN_BINDINGS,
    THEME_TOKEN_BINDINGS,
    TOKENS_BASE_AXIS,
    tokensThemeAxis,
} from './schemas/tokens'
import { PHYSICS_AXIS, physicsPayload } from './schemas/physics'
import type { TokenBinding } from './schemas/tokens'

type AxisTab = 'tokens' | 'physics' | 'layout'

const TOKEN_AXES = [
    TOKENS_BASE_AXIS,
    tokensThemeAxis('dark'),
    tokensThemeAxis('light'),
]

const panelStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: 320,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(13, 17, 21, 0.97)',
    borderLeft: '1px solid rgba(255,255,255,0.15)',
    color: '#e0e8f0',
    fontFamily: 'monospace',
    fontSize: 12,
    boxSizing: 'border-box',
}

const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
}

const tabListStyle: CSSProperties = {
    display: 'flex',
    gap: 4,
    padding: '8px 12px 0',
}

const bodyStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 12,
}

const footerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 12,
    borderTop: '1px solid rgba(255,255,255,0.15)',
}

const buttonStyle: CSSProperties = {
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 3,
    color: '#e0e8f0',
    fontFamily: 'monospace',
    fontSize: 11,
    cursor: 'pointer',
}

const inputStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#e0e8f0',
    padding: '4px 6px',
    borderRadius: 3,
    fontFamily: 'monospace',
    fontSize: 11,
}

function tabStyle(selected: boolean): CSSProperties {
    return {
        ...buttonStyle,
        borderBottom: 'none',
        borderRadius: '3px 3px 0 0',
        background: selected ? 'rgba(95,182,196,0.18)' : 'transparent',
        color: selected ? '#5fb6c4' : '#8ab4d0',
    }
}

interface WriteStatus {
    tone: 'ok' | 'warn' | 'error'
    message: string
}

const statusColor: Record<WriteStatus['tone'], string> = {
    ok: '#7bc88a',
    warn: '#e8b04a',
    error: '#e87a7a',
}

async function postWrite(
    target: string,
    payload: unknown,
): Promise<{ ok: boolean; warnings?: string[]; error?: string }> {
    const res = await fetch('/__atelier/write', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target, payload }),
    })
    return (await res.json()) as { ok: boolean; warnings?: string[]; error?: string }
}

export default function AtelierPanel({ open }: { open: boolean }) {
    const store = getAtelierStore()
    ensureTokensBinding()
    ensurePhysicsBinding()
    const state = useAtelierState()
    const { theme, setTheme } = useTheme()
    const [tab, setTab] = useState<AxisTab>('tokens')
    const [setName, setSetName] = useState('')
    const [writing, setWriting] = useState(false)
    const [status, setStatus] = useState<WriteStatus | null>(null)

    const tokensDirty = TOKEN_AXES.reduce(
        (n, axis) => n + store.dirtyPaths(axis).length,
        0,
    )
    const physicsDirty = store.dirtyPaths(PHYSICS_AXIS).length
    const dirtyCount = tokensDirty + physicsDirty

    async function writeBack() {
        const { axes, baselines } = store.get()
        const snap = (axis: string, bindings: Record<string, TokenBinding>) => ({
            working: axes[axis] ?? {},
            baseline: baselines[axis] ?? axes[axis] ?? {},
            bindings,
        })
        setWriting(true)
        setStatus(null)
        try {
            const written: string[] = []
            const warnings: string[] = []
            if (tokensDirty > 0) {
                const body = await postWrite(
                    'tokens',
                    buildTokenEdits({
                        base: snap(TOKENS_BASE_AXIS, BASE_TOKEN_BINDINGS),
                        dark: snap(tokensThemeAxis('dark'), THEME_TOKEN_BINDINGS),
                        light: snap(tokensThemeAxis('light'), THEME_TOKEN_BINDINGS),
                    }),
                )
                if (!body.ok) {
                    setStatus({ tone: 'error', message: body.error ?? 'write failed' })
                    return
                }
                ensureTokensBinding().writeBackReconcile()
                warnings.push(...(body.warnings ?? []))
                written.push('tokens.css')
            }
            if (physicsDirty > 0) {
                const body = await postWrite(
                    'physics',
                    physicsPayload(axes[PHYSICS_AXIS] ?? {}),
                )
                if (!body.ok) {
                    setStatus({ tone: 'error', message: body.error ?? 'write failed' })
                    return
                }
                ensurePhysicsBinding().writeBackReconcile()
                written.push('physicsTuning.ts')
            }
            setStatus(
                warnings.length
                    ? { tone: 'warn', message: warnings.join(' · ') }
                    : { tone: 'ok', message: `written to ${written.join(', ')}` },
            )
        } catch (err) {
            setStatus({ tone: 'error', message: String(err) })
        } finally {
            setWriting(false)
        }
    }

    const setNames = Object.keys(state.sets)

    return (
        <aside
            data-testid="atelier-panel"
            data-atelier-marker={ATELIER_ONLY_BUNDLE_MARKER}
            aria-label="Atelier inspector"
            style={{ ...panelStyle, display: open ? 'flex' : 'none' }}
        >
            <header style={headerStyle}>
                <strong style={{ color: '#5fb6c4', letterSpacing: '0.08em' }}>ATELIER</strong>
                <div role="group" aria-label="Theme" style={{ display: 'flex', gap: 4 }}>
                    {(['dark', 'light'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            aria-pressed={theme === t}
                            style={{
                                ...buttonStyle,
                                background:
                                    theme === t ? 'rgba(95,182,196,0.18)' : 'transparent',
                                color: theme === t ? '#5fb6c4' : '#8ab4d0',
                            }}
                            onClick={() => setTheme(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </header>

            <nav role="tablist" aria-label="Axes" style={tabListStyle}>
                {(
                    [
                        ['tokens', 'Tokens'],
                        ['physics', 'Physics'],
                        ['layout', 'Layout'],
                    ] as const
                ).map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={tab === key}
                        style={tabStyle(tab === key)}
                        onClick={() => setTab(key)}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            <div style={bodyStyle}>
                {tab === 'tokens' && <TokensAxis state={state} theme={theme} />}
                {tab === 'physics' && <PhysicsAxis state={state} />}
                {tab === 'layout' && (
                    <p style={{ color: '#5f7a8a' }}>Layout axis lands with task-008.</p>
                )}
            </div>

            <footer style={footerStyle}>
                <div style={{ display: 'flex', gap: 6 }}>
                    <select
                        aria-label="Working set"
                        value={state.activeSet ?? ''}
                        onChange={(e) => {
                            if (e.target.value) store.switchSet(e.target.value)
                        }}
                        style={{ ...inputStyle, flex: 1 }}
                    >
                        <option value="" disabled>
                            — working set —
                        </option>
                        {setNames.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <input
                        aria-label="New set name"
                        placeholder="set name"
                        value={setName}
                        onChange={(e) => setSetName(e.target.value)}
                        style={inputStyle}
                    />
                    <button
                        type="button"
                        style={buttonStyle}
                        disabled={!setName.trim()}
                        onClick={() => {
                            store.saveSet(setName.trim())
                            setSetName('')
                        }}
                    >
                        Save
                    </button>
                </div>
                <button
                    type="button"
                    style={{
                        ...buttonStyle,
                        color: dirtyCount > 0 ? '#e8b04a' : '#5f7a8a',
                    }}
                    disabled={dirtyCount === 0 || writing}
                    onClick={() => void writeBack()}
                >
                    {writing ? 'writing…' : `Write back${dirtyCount ? ` (${dirtyCount})` : ''}`}
                </button>
                {status && (
                    <p
                        role="status"
                        style={{ margin: 0, fontSize: 10, color: statusColor[status.tone] }}
                    >
                        {status.message}
                    </p>
                )}
            </footer>
        </aside>
    )
}
