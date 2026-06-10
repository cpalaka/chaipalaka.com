/**
 * Layout axis body — arrange-mode toggle, route-level gravity select, card
 * list with live fraction readout, and the selected card's mini-inspector
 * (parent / kind). Data-layout routes only: chain routes build their
 * PageDef in code at runtime and have no write-back target in v1 (their
 * constants land with task-009).
 *
 * Arrange drags arrive through the arrangeMode seam as pointer px; they
 * convert to viewport fractions here and flow store → layoutBinding →
 * layoutOverride → Page, so the card re-tethers and pendulum-settles under
 * its moving anchor.
 */

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import { useController } from '../state/useController'
import {
    getArrangeMode,
    setArrangeMode,
    subscribeArrangeDrag,
} from '../card/arrangeMode'
import type { AtelierState, AxisValues } from './atelierStore'
import {
    ensureChainBinding,
    ensureLayoutBinding,
    getAtelierStore,
} from './useAtelier'
import {
    DETACHED,
    LAYOUT_ROUTES,
    descendantsOf,
    layoutAxis,
    routeForPathname,
} from './schemas/layout'
import { CHAIN_AXIS, CHAIN_SCHEMA, isChainPathname } from './schemas/chain'
import { TuningFields } from './widgets'
import { defaultsOf } from '../canvas/scenes/paramSchema'

const captionStyle: CSSProperties = {
    color: '#5f7a8a',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: 0,
}

const labelTextStyle: CSSProperties = {
    color: '#8ab4d0',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontSize: 10,
}

const selectStyle: CSSProperties = {
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

const rowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontFamily: 'monospace',
    fontSize: 12,
}

function cardRowStyle(selected: boolean): CSSProperties {
    return {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 6,
        padding: '4px 6px',
        border: `1px solid ${selected ? '#5fb6c4' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 3,
        background: selected ? 'rgba(95,182,196,0.12)' : 'transparent',
        color: selected ? '#5fb6c4' : '#a0b8c8',
        fontFamily: 'monospace',
        fontSize: 11,
        cursor: 'pointer',
        textAlign: 'left',
    }
}

const round = (v: number) => Math.round(v * 10000) / 10000

export function LayoutAxis({ state }: { state: AtelierState }) {
    const { pathname } = useLocation()
    const route = routeForPathname(pathname)
    if (route) {
        return <LayoutAxisBody key={route} route={route} state={state} />
    }
    if (isChainPathname(pathname)) {
        return <ChainAxisBody state={state} />
    }
    return (
        <p style={{ color: '#5f7a8a', margin: 0 }}>
            Neither a data-layout route nor a chain route — the / placeholder
            keeps its computed letter anchors.
        </p>
    )
}

function ChainAxisBody({ state }: { state: AtelierState }) {
    const store = getAtelierStore()

    // Bind in an effect, not during render — see LayoutAxisBody.
    useEffect(() => {
        ensureChainBinding()
    }, [])

    const values = state.axes[CHAIN_AXIS]
    if (!values) return null

    return (
        <>
            <p style={captionStyle}>chain constants — re-partition live</p>
            <TuningFields
                schema={CHAIN_SCHEMA}
                values={values ?? defaultsOf(CHAIN_SCHEMA)}
                onChange={(next) => store.setValues(CHAIN_AXIS, next)}
                isDirty={(path) => store.isDirty(CHAIN_AXIS, path)}
                onReset={(path) => store.resetField(CHAIN_AXIS, path)}
            />
        </>
    )
}

function LayoutAxisBody({ route, state }: { route: string; state: AtelierState }) {
    const store = getAtelierStore()
    const axis = layoutAxis(route)
    const layout = LAYOUT_ROUTES[route]!.layout
    const arrange = useController(getArrangeMode)
    const [selected, setSelected] = useState<string | null>(null)

    // Bind in an effect, not during render — registering the axis commits
    // store state, and committing mid-render would set sibling components'
    // state while this one renders.
    useEffect(() => {
        ensureLayoutBinding(route)
    }, [route])

    // Arrange mode must not outlive the Layout tab — pointer semantics
    // revert when this body unmounts (tab switch, route change, collapse).
    useEffect(() => () => setArrangeMode(false), [])

    useEffect(
        () =>
            subscribeArrangeDrag((report) => {
                if (report.type === 'down') {
                    setSelected(report.id)
                    return
                }
                const working = store.get().axes[axis]
                const card = working?.[report.id]
                if (typeof card !== 'object' || card === null) return
                store.setValues(axis, {
                    ...working,
                    [report.id]: {
                        ...(card as AxisValues),
                        fx: round(report.x / window.innerWidth),
                        fy: round(report.y / window.innerHeight),
                    },
                })
            }),
        [axis, store],
    )

    const values = state.axes[axis]
    if (!values) return null

    const gravityDirty = store.isDirty(axis, 'gravity')
    const setCardField = (id: string, field: string, value: unknown) => {
        const card = values[id] as AxisValues
        store.setValues(axis, { ...values, [id]: { ...card, [field]: value } })
    }

    const selectedCard =
        selected && typeof values[selected] === 'object'
            ? (values[selected] as AxisValues)
            : null
    const blockedParents = selected
        ? descendantsOf(values, layout, selected)
        : new Set<string>()

    return (
        <>
            <label
                style={{ ...rowStyle, flexDirection: 'row', gap: 6, alignItems: 'center' }}
            >
                <input
                    type="checkbox"
                    checked={arrange}
                    onChange={(e) => setArrangeMode(e.target.checked)}
                />
                <span style={labelTextStyle}>Arrange mode</span>
            </label>
            <p style={captionStyle}>
                {arrange
                    ? 'drag a card to move its anchor'
                    : 'normal drag flings — toggle to arrange'}
            </p>

            <label style={rowStyle}>
                <span style={labelTextStyle}>
                    Gravity{gravityDirty ? ' •' : ''}
                </span>
                <select
                    value={values['gravity'] as string}
                    onChange={(e) =>
                        store.setValues(axis, { ...values, gravity: e.target.value })
                    }
                    style={selectStyle}
                >
                    {['down', 'up', 'left', 'right'].map((g) => (
                        <option key={g} value={g}>
                            {g}
                        </option>
                    ))}
                </select>
            </label>

            <p style={captionStyle}>cards</p>
            {layout.cards.map((card) => {
                const record = values[card.id] as AxisValues
                const dirty = ['fx', 'fy', 'parent', 'kind'].some((f) =>
                    store.isDirty(axis, `${card.id}.${f}`),
                )
                return (
                    <button
                        key={card.id}
                        type="button"
                        style={cardRowStyle(selected === card.id)}
                        onClick={() => setSelected(card.id)}
                    >
                        <span>
                            {card.id}
                            {dirty ? ' •' : ''}
                        </span>
                        <span>
                            {(record['fx'] as number).toFixed(3)},{' '}
                            {(record['fy'] as number).toFixed(3)}
                        </span>
                    </button>
                )
            })}

            {selected && selectedCard && (
                <fieldset
                    style={{
                        border: '1px solid rgba(95,182,196,0.4)',
                        borderRadius: 3,
                        padding: '8px 8px 10px',
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                    }}
                >
                    <legend style={{ ...labelTextStyle, color: '#5fb6c4' }}>
                        {selected}
                    </legend>
                    <label style={rowStyle}>
                        <span style={labelTextStyle}>Parent</span>
                        <select
                            value={selectedCard['parent'] as string}
                            onChange={(e) => setCardField(selected, 'parent', e.target.value)}
                            style={selectStyle}
                        >
                            {[
                                'ceiling',
                                'floor',
                                DETACHED,
                                ...layout.cards
                                    .map((c) => c.id)
                                    .filter(
                                        (id) => id !== selected && !blockedParents.has(id),
                                    ),
                            ].map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label style={rowStyle}>
                        <span style={labelTextStyle}>Kind</span>
                        <select
                            value={selectedCard['kind'] as string}
                            onChange={(e) => setCardField(selected, 'kind', e.target.value)}
                            style={selectStyle}
                        >
                            {['lifelog', 'blog', 'portfolio', 'note', 'link', 'headline', 'nav'].map(
                                (k) => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ),
                            )}
                        </select>
                    </label>
                </fieldset>
            )}
        </>
    )
}
