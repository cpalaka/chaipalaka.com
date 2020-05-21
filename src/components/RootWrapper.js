import React, { useReducer, useEffect, useState, useCallback } from 'react'
import { ThemeProvider } from 'styled-components'
import theme from '../theme'
import GlobalStyles from '../theme/globalStyles'
import {
    globalDispatchContext,
    globalStateContext,
    globalStateReducer,
    initialState,
} from '../state'

const RootWrapper = ({ children, ...props }) => {
    const [state, dispatch] = useReducer(globalStateReducer, initialState)
    const currentTheme = theme[state.theme]

    const applySavedTheme = useCallback(() => {
        dispatch({ type: 'setTheme', theme: localStorage.getItem('theme') || state.theme })
    }, [dispatch])

    useEffect(() => {
        applySavedTheme()
    }, [])

    return (
        <globalDispatchContext.Provider value={dispatch}>
            <globalStateContext.Provider value={state}>
                <ThemeProvider theme={currentTheme}>
                    <>
                        <GlobalStyles />
                        {children}
                    </>
                </ThemeProvider>
            </globalStateContext.Provider>
        </globalDispatchContext.Provider>
    )
}

export default RootWrapper
