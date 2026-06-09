/**
 * Tokens axis body — palette widgets for the active theme's axis plus the
 * always-applied base groups (card chrome, typography, spacing). Edits go to
 * the AtelierStore; the tokens binding mirrors dirty fields onto the
 * document (see tokensBinding.ts).
 */

import type { CSSProperties } from 'react'
import { defaultsOf } from '../canvas/scenes/paramSchema'
import type { AtelierState } from './atelierStore'
import type { Theme } from '../controls/theme'
import { TuningFields } from './widgets'
import { getAtelierStore } from './useAtelier'
import {
    TOKENS_BASE_SCHEMA,
    TOKENS_THEME_SCHEMA,
    TOKENS_BASE_AXIS,
    tokensThemeAxis,
} from './schemas/tokens'

const captionStyle: CSSProperties = {
    color: '#5f7a8a',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: 0,
}

export function TokensAxis({ state, theme }: { state: AtelierState; theme: Theme }) {
    const store = getAtelierStore()
    const themeAxis = tokensThemeAxis(theme)
    return (
        <>
            <p style={captionStyle}>editing {theme} palette</p>
            <TuningFields
                schema={TOKENS_THEME_SCHEMA}
                values={state.axes[themeAxis] ?? defaultsOf(TOKENS_THEME_SCHEMA)}
                onChange={(next) => store.setValues(themeAxis, next)}
                isDirty={(path) => store.isDirty(themeAxis, path)}
                onReset={(path) => store.resetField(themeAxis, path)}
            />
            <TuningFields
                schema={TOKENS_BASE_SCHEMA}
                values={state.axes[TOKENS_BASE_AXIS] ?? defaultsOf(TOKENS_BASE_SCHEMA)}
                onChange={(next) => store.setValues(TOKENS_BASE_AXIS, next)}
                isDirty={(path) => store.isDirty(TOKENS_BASE_AXIS, path)}
                onReset={(path) => store.resetField(TOKENS_BASE_AXIS, path)}
            />
        </>
    )
}
