import React, { useReducer, useEffect, useState } from 'react'
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
    const useSavedTheme = state => {
        if (typeof window !== `undefined`) {
            state.theme = localStorage.getItem('theme') || state.theme
            return state
        } else {
            return state
        }
    }
    
    const [state, dispatch] = useReducer(globalStateReducer, useSavedTheme(initialState))
    const currentTheme = theme[state.theme]

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
